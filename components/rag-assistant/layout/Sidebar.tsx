import type { DocumentSummary } from "@/lib/rag-assistant/types";

interface SidebarProps {
  documents: DocumentSummary[];
  isLoading: boolean;
  error: string | null;
  selectedDocumentId: string | null;
  onSelectDocument(documentId: string): void;
  isAdmin: boolean;
  onUploadClick(): void;
}

export function Sidebar({
  documents,
  isLoading,
  error,
  selectedDocumentId,
  onSelectDocument,
  isAdmin,
  onUploadClick,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-head">
          <div className="sidebar-label">Documents</div>
          {isAdmin ? (
            <button
              className="btn-ghost btn-ghost-sm"
              onClick={onUploadClick}
              type="button"
            >
              <UploadFileIcon />
              Upload
            </button>
          ) : null}
        </div>

        <div className="doc-list">
          {isLoading ? (
            <div className="sidebar-note">Loading documents…</div>
          ) : null}

          {error ? <div className="sidebar-note sidebar-note-error">{error}</div> : null}

          {!isLoading && documents.length === 0 ? (
            <div className="sidebar-note">
              Upload a document to start indexing your knowledge base.
            </div>
          ) : null}

          {documents.map((document) => (
            <button
              key={document.id}
              className={`doc-item ${
                selectedDocumentId === document.id ? "active" : ""
              }`}
              onClick={() => onSelectDocument(document.id)}
              type="button"
            >
              <div className={`doc-icon ${fileTypeClass(document.name)}`}>
                {fileTypeLabel(document.name)}
              </div>
              <div className="doc-info">
                <div className="doc-name">{document.name}</div>
              </div>
              <div className="doc-status">
                <div className={`dot-${document.status}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function fileTypeClass(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "xlsx") {
    return "xls";
  }

  if (extension === "txt") {
    return "txt";
  }

  return "pdf";
}

function fileTypeLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return (extension ?? "pdf").slice(0, 3).toUpperCase();
}

function UploadFileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 10V3.75M8 3.75L5.75 6M8 3.75L10.25 6M4 11.5V12C4 12.5523 4.44772 13 5 13H11C11.5523 13 12 12.5523 12 12V11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
