import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  BookText,
  FileSpreadsheet,
  FileText,
  Files,
  Folder,
  HelpCircle,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import type { DocumentType, KnowledgeDocument } from '../types/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DocumentStatusBadge, DocumentTypeBadge } from '../components/Badge';
import { Field, Input, Select } from '../components/FormControls';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastContext';
import { cx, formatDateTime } from '../lib/format';
import { documentTypeMeta } from '../lib/meta';
import { documentTypeLabels } from '../types/domain';

const FILE_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  doc: BookText,
  docx: BookText,
};

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICON[ext] ?? FileText;
}

export function DocumentsPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filter, setFilter] = useState<DocumentType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('refund_policy');
  const [fileName, setFileName] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setDocuments(await api.listDocuments());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !fileName.trim()) return;
    await api.uploadDocument({ title, type, fileName });
    setTitle('');
    setFileName('');
    setUploadOpen(false);
    showToast('문서를 등록했습니다.');
    await load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.deleteDocument(deleteTarget.id);
    setDeleteTarget(null);
    showToast('문서를 삭제했습니다.', 'info');
    await load();
  }

  const filtered =
    filter === 'all' ? documents : documents.filter((d) => d.type === filter);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <Files className="h-3 w-3" /> Knowledge
          </>
        }
        title="문서 관리"
        description="RAG 답변 초안 생성에 사용할 정책·FAQ·상품 정보 문서를 등록·관리합니다."
        actions={
          <Button size="md" icon={<Plus className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
            문서 업로드
          </Button>
        }
      />

      {/* Type filter */}
      <div className="flex items-center gap-2">
        <FilterTab active={filter === 'all'} onClick={() => setFilter('all')} count={documents.length}>
          전체
        </FilterTab>
        {(Object.keys(documentTypeMeta) as DocumentType[]).map((t) => (
          <FilterTab
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            count={documents.filter((d) => d.type === t).length}
            dot={documentTypeMeta[t].dot}
          >
            {documentTypeMeta[t].label}
          </FilterTab>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="등록된 문서가 없어요"
            description="정책·FAQ·상품 정보 문서를 업로드하면 AI가 답변 초안을 생성할 때 인용합니다."
            icon={<Folder className="h-6 w-6" />}
            action={
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setUploadOpen(true)}>
                문서 업로드
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const Icon = fileIcon(doc.fileName);
            const meta = documentTypeMeta[doc.type];
            return (
              <Card key={doc.id} flush className="group transition hover:shadow-md">
                <div className="flex items-start gap-3 px-4 pt-4">
                  <span
                    className={cx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      meta.wash,
                      meta.ink,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{doc.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-ink-500">
                      {doc.fileName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 pt-3">
                  <DocumentTypeBadge type={doc.type} size="xs" />
                  <DocumentStatusBadge status={doc.status} size="xs" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line bg-surface-muted/30 px-4 py-2.5 text-[11px]">
                  <div className="flex items-center gap-2 text-ink-500">
                    <span className="tabular">{formatDateTime(doc.uploadedAt)}</span>
                    <span>·</span>
                    <span className="tabular">{doc.fileSize}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(doc)}
                    aria-label="삭제"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hint card */}
      <Card flush>
        <div className="flex items-start gap-3 px-5 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-info-50 text-info-600">
            <HelpCircle className="h-4 w-4" />
          </span>
          <div className="text-xs text-ink-600">
            <p className="font-semibold text-ink-800">PoC 안내</p>
            <p className="mt-0.5 leading-relaxed text-ink-500">
              업로드된 파일은 실제로 저장되지 않으며, 메타데이터만 mock 데이터에 등록됩니다.
              실제 RAG 색인 및 임베딩은 백엔드 단계에서 연결됩니다.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="문서 업로드"
        description="RAG 답변 생성에 사용될 문서 메타데이터를 등록합니다."
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setUploadOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              icon={<Upload className="h-3.5 w-3.5" />}
              onClick={() =>
                document.getElementById('upload-form-submit')?.click()
              }
              disabled={!title.trim() || !fileName.trim()}
            >
              업로드
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleUpload}>
          <Field label="문서 제목" required>
            <Input
              placeholder="예: 2026 환불/교환 정책 v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="문서 유형">
              <Select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="파일명" required hint="예: refund-policy-v2.pdf">
              <Input
                placeholder="policy.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </Field>
          </div>
          {/* Mock drop zone */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface-muted/40 px-4 py-6 text-center">
            <Upload className="mb-2 h-5 w-5 text-ink-400" />
            <p className="text-xs font-semibold text-ink-700">파일을 드래그하거나 클릭해 업로드</p>
            <p className="mt-1 text-[11px] text-ink-500">
              PDF, DOCX, XLSX, CSV · 최대 20 MB (PoC mock)
            </p>
          </div>
          <button id="upload-form-submit" type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="문서 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} icon={<Trash2 className="h-3.5 w-3.5" />}>
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-700">
          <span className="font-semibold text-ink-900">{deleteTarget?.title}</span> 문서를 삭제합니다.
          PoC에서는 mock 데이터에서만 제거됩니다.
        </p>
      </Modal>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
  count,
  dot,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  count?: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition',
        active
          ? 'bg-ink-900 text-white shadow-xs'
          : 'text-ink-600 hover:bg-surface-muted hover:text-ink-900',
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
      {count !== undefined && (
        <span
          className={cx(
            'inline-flex h-4 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular',
            active ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
