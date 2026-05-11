<?php

return [

    'model' => env('HUGGINGFACE_EMBEDDING_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'),

    'warn_min_percent' => (int) env('IDEA_SIMILARITY_WARN_MIN', 40),

    'block_min_percent' => (int) env('IDEA_SIMILARITY_BLOCK_MIN', 70),

    'max_text_chars' => (int) env('IDEA_SIMILARITY_MAX_TEXT_CHARS', 8000),

    'projects_directory' => 'projects',

    /*
     * When false (default): unchanged behaviour — synchronous Hugging Face embed during upload.
     * When true: response returns faster using text-only similarity; embeddings are filled asynchronously
     * by ProcessProjectEmbeddingJob (no change to persisted workflow, only avoids blocking HTTP).
     */
    'defer_embedding' => env('ORIGINALITY_DEFER_EMBEDDING', false),

];
