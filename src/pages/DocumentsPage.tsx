import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { DocumentType, KnowledgeDocument } from '../types/domain';
import { documentTypeLabels } from '../types/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Input, Select } from '../components/FormControls';
import { Cell, Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../components/ToastContext';
import { formatDateTime } from '../lib/format';

export function DocumentsPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('refund_policy');
  const [fileName, setFileName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    showToast('문서를 등록했습니다.');
    await load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.deleteDocument(deleteTarget.id);
    setDeleteTarget(null);
    showToast('문서를 삭제했습니다.');
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink-900">문서 관리</h2>
        <p className="mt-2 text-sm text-ink-500">RAG 초안 생성에 사용할 정책, FAQ, 상품 정보 문서를 mock으로 관리합니다.</p>
      </div>

      <Card title="문서 업로드" description="실제 파일 저장은 백엔드 이후 구현하고, 현재는 메타데이터만 등록합니다.">
        <form className="grid grid-cols-[1fr_220px_1fr_auto] items-end gap-3" onSubmit={handleUpload}>
          <Field label="문서명">
            <Input placeholder="예: 2026 환불 정책" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="문서 유형">
            <Select value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="파일명">
            <Input placeholder="policy.pdf" value={fileName} onChange={(event) => setFileName(event.target.value)} />
          </Field>
          <Button icon={<FileUp className="h-4 w-4" />}>등록</Button>
        </form>
      </Card>

      <Card title="문서 목록" description={`${documents.length}개의 문서가 등록되어 있습니다.`}>
        {isLoading ? (
          <p className="text-sm font-bold text-ink-500">문서를 불러오는 중입니다...</p>
        ) : (
          <Table headers={['ID', '문서명', '유형', '업로드일', '상태', '파일', '삭제']}>
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-ink-50">
                <Cell className="font-bold text-ink-900">{document.id}</Cell>
                <Cell>{document.title}</Cell>
                <Cell>{documentTypeLabels[document.type]}</Cell>
                <Cell>{formatDateTime(document.uploadedAt)}</Cell>
                <Cell>
                  <Badge label={document.status === 'active' ? '활성' : document.status === 'processing' ? '처리중' : '보관'} tone={document.status === 'active' ? 'green' : 'amber'} />
                </Cell>
                <Cell>
                  <span className="font-semibold">{document.fileName}</span>
                  <span className="ml-2 text-xs text-ink-500">{document.fileSize}</span>
                </Cell>
                <Cell>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(document)}>
                    삭제
                  </Button>
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={Boolean(deleteTarget)} title="문서 삭제" onClose={() => setDeleteTarget(null)}>
        <p className="text-sm leading-6 text-ink-700">
          <strong>{deleteTarget?.title}</strong> 문서를 삭제합니다. PoC에서는 mock 데이터에서만 제거됩니다.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}
