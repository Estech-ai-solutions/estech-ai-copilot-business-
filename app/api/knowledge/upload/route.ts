import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/lib/knowledge/chunking';
import { generateEmbedding } from '@/lib/knowledge/embeddings';
import { createKnowledgeChunks } from '@/lib/knowledge/indexing';
import pdf from 'pdf-parse';
import { extractRawText } from 'mammoth';
import { getUserAndWorkspace } from '@/lib/auth-server';

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    try {
      const data = await pdf(buffer);
      return data.text || '';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
    }
  }

  if (extension === 'docx') {
    try {
      const result = await extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX. The file may be corrupted or in an unsupported format.');
    }
  }

  if (extension === 'txt' || extension === 'md') {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Text file read error:', error);
      throw new Error('Failed to read text file.');
    }
  }

  throw new Error(`Unsupported file type: .${extension}`);
}

export async function POST(request: NextRequest) {
  try {
    const result = await getUserAndWorkspace(request);
    if (result.error === 'AuthServiceUnavailable') {
      return NextResponse.json({ error: result.message }, { status: 502 });
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { supabase, workspaceId, userId } = result;

    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const category = formData.get('category') as string | null;
    const tags = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ];

    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, DOCX, TXT, Markdown' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    let textContent: string;

    try {
      textContent = await extractTextFromFile(file);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to extract text from file. Please ensure the file is not corrupted.' },
        { status: 400 }
      );
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any text from the file. The file may be empty or corrupted.' },
        { status: 400 }
      );
    }

    const entryTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, '');
    const entryCategory = category?.trim() || 'general';
    const entryTags = tags
      ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [fileExtension.replace('.', '')];

    const { data: sourceData, error: sourceError } = await supabase
      .from('knowledge_sources')
      .insert({
        user_id: userId,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        processing_status: 'processing',
        storage_path: null,
      })
      .select()
      .single();

    if (sourceError || !sourceData) {
      console.error('Failed to create knowledge source:', sourceError);
      return NextResponse.json(
        { error: sourceError?.message || 'Failed to create knowledge source' },
        { status: 500 }
      );
    }

    const sourceId = sourceData.id;

    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge')
      .insert({
        workspace_id: workspaceId,
        title: entryTitle,
        category: entryCategory,
        content: textContent.trim(),
        tags: entryTags,
        source_type: 'upload',
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        processing_status: 'processing',
        created_by: userId,
      })
      .select()
      .single();

    if (knowledgeError || !knowledgeData) {
      await supabase
        .from('knowledge_sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId);

      if (knowledgeError?.code === '23505') {
        return NextResponse.json(
          { error: 'A knowledge entry with this title and category already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: knowledgeError?.message || 'Failed to create knowledge entry' },
        { status: 500 }
      );
    }

    const knowledgeId = knowledgeData.id;

    try {
      const { chunkCount, failed } = await createKnowledgeChunks(
        supabase,
        knowledgeId,
        sourceId,
        textContent.trim(),
        entryCategory,
        file.name
      );

      const status = failed ? 'failed' : 'ready';
      await supabase
        .from('knowledge')
        .update({ processing_status: status })
        .eq('id', knowledgeId);

      await supabase
        .from('knowledge_sources')
        .update({ processing_status: status })
        .eq('id', sourceId);

      if (failed) {
        return NextResponse.json(
          { error: 'Some chunks failed to embed. The knowledge base may be temporarily unavailable.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ entry: knowledgeData, source_id: sourceId, chunk_count: chunkCount });
    } catch (error) {
      await supabase
        .from('knowledge')
        .update({ processing_status: 'failed' })
        .eq('id', knowledgeId);

      await supabase
        .from('knowledge_sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId);

      console.error('Chunking/embedding error:', error);
      const message = error instanceof Error ? error.message : 'Failed to process file chunks';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process file upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
