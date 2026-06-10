'use client'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Upload, Trash2, FileText, RefreshCw, CheckCircle, Clock, AlertCircle, File, FileType } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const statusConfig: any = {
  PROCESSING: { label: 'Processing', icon: Clock,         cls: 'badge-yellow' },
  INDEXED:    { label: 'Indexed',    icon: CheckCircle,   cls: 'badge-green' },
  FAILED:     { label: 'Failed',     icon: AlertCircle,   cls: 'badge-red' },
}

const fileTypeColors: any = {
  pdf:  'bg-red-50 text-red-600',
  docx: 'bg-blue-50 text-blue-600',
  txt:  'bg-gray-50 text-gray-600',
  md:   'bg-purple-50 text-purple-600',
}

export default function KnowledgeBasePage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/knowledge').then(r => r.data),
    refetchInterval: 5000,
  })

  const uploadMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/knowledge/upload', fd)
    },
    onSuccess: () => {
      toast.success('Document uploaded — processing started')
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Upload failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge/${id}`),
    onSuccess: () => {
      toast.success('Document deleted')
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const reindexMut = useMutation({
    mutationFn: (id: string) => api.post(`/knowledge/${id}/reindex`),
    onSuccess: () => {
      toast.success('Reindexing started')
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadMut.mutate(f))
  }

  const indexed = docs.filter((d: any) => d.status === 'INDEXED').length
  const totalChunks = docs.reduce((sum: number, d: any) => sum + (d._count?.chunks || 0), 0)

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Knowledge Base</h1>
        <p className="page-sub">Upload documents to train your AI assistant</p>
      </div>

      {/* Stats row */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Documents', value: docs.length },
            { label: 'Indexed', value: indexed },
            { label: 'Total Chunks', value: totalChunks },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <p className="text-xl font-bold text-ink-1">{value}</p>
              <p className="text-xs text-ink-3 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
          dragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-surface-3 hover:border-brand-300 hover:bg-surface-1'
        )}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        <div className={clsx(
          'w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors',
          dragging ? 'bg-brand-100' : 'bg-surface-2'
        )}>
          <Upload size={22} className={dragging ? 'text-brand-600' : 'text-ink-3'} />
        </div>
        <p className="text-sm font-semibold text-ink-1">
          {dragging ? 'Drop to upload' : 'Drop files or click to browse'}
        </p>
        <p className="text-xs text-ink-4 mt-1">PDF, DOCX, TXT, Markdown</p>
        {uploadMut.isPending && (
          <p className="text-brand-600 text-xs mt-3 font-medium animate-pulse">Uploading…</p>
        )}
      </div>

      {/* Document list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-1">Documents</p>
          <span className="text-xs text-ink-4 bg-surface-2 rounded-lg px-2 py-1">{docs.length}</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText size={20} className="text-ink-4" />
            </div>
            <p className="text-sm font-medium text-ink-2">No documents yet</p>
            <p className="text-xs text-ink-4 mt-1">Upload your first document above to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-2">
            {docs.map((doc: any) => {
              const status = statusConfig[doc.status] || statusConfig.PROCESSING
              const StatusIcon = status.icon
              const ftColor = fileTypeColors[doc.fileType] || 'bg-surface-2 text-ink-3'
              return (
                <div key={doc.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-1 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${ftColor}`}>
                    {doc.fileType.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-1 truncate">{doc.name}</p>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {formatBytes(doc.fileSize)} · {doc._count?.chunks ?? 0} chunks · {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={clsx(status.cls, 'flex items-center gap-1 flex-shrink-0')}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => reindexMut.mutate(doc.id)}
                      className="btn-ghost p-1.5 rounded-lg"
                      title="Re-index"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this document?')) deleteMut.mutate(doc.id) }}
                      className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
