// //src/components/ExcalidrawCanvas.tsx
// 'use client';
// // import ExcalidrawCanvas from '@/components/ExcalidrawCanvas';

// import { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';

// interface ExcalidrawElement {
//   id: string;
//   type: string;
//   [key: string]: any;
// }

// interface ExcalidrawContent {
//   type: string;
//   elements: ExcalidrawElement[];
// }

// interface ExcalidrawCanvasProps {
//   noteId: number | null;
//   userId: number;
//   initialContent: ExcalidrawContent | null;
//   onSave: (updatedNote: any) => void;
// }

// const Excalidraw = dynamic(
//   () =>
//     import('@excalidraw/excalidraw').then(
//       (mod) => mod.Excalidraw
//     ),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="canvas-loading">
//         <div className="notes-spinner" />
//         <p>Loading canvas...</p>
//       </div>
//     ),
//   }
// );

// import '@excalidraw/excalidraw/index.css';

// export default function ExcalidrawCanvas({
//   noteId,
//   userId,
//   initialContent,
//   onSave,
// }: ExcalidrawCanvasProps) {
//   const [elements, setElements] = useState<any[]>([]);

//   const [loading, setLoading] = useState<boolean>(false);

//   const [isMounted, setIsMounted] = useState<boolean>(false);

//   const [hasLoaded, setHasLoaded] =
//     useState<boolean>(false);

//   const [saveMessage, setSaveMessage] =
//     useState<string>('');

//   const currentNoteIdRef =
//     useRef<number | null>(null);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   useEffect(() => {
//     if (!isMounted) return;

//     const noteChanged =
//       noteId !== currentNoteIdRef.current;

//     if (noteChanged) {
//       setElements([]);
//       setHasLoaded(false);
//       setSaveMessage('');

//       if (initialContent) {
//         try {
//           const parsed =
//             typeof initialContent === 'string'
//               ? JSON.parse(initialContent)
//               : initialContent;

//           const loadedElements =
//             parsed?.elements || [];

//           setElements(loadedElements);
//           setHasLoaded(true);
//         } catch (error) {
//           console.error(
//             'Error parsing content:',
//             error
//           );

//           setElements([]);
//           setHasLoaded(true);
//         }
//       } else {
//         setHasLoaded(true);
//       }

//       currentNoteIdRef.current = noteId;
//     }
//   }, [noteId, initialContent, isMounted]);

//   const handleSave = async (): Promise<void> => {
//     if (!noteId) {
//       console.error('No note ID');
//       return;
//     }

//     setLoading(true);
//     setSaveMessage('');

//     try {
//       const response = await fetch(
//         `/api/canvas/${noteId}`,
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             userId: userId,
//             content: {
//               type: 'excalidraw',
//               elements,
//             },
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         setSaveMessage('Saved successfully');

//         onSave(data.data);

//         window.setTimeout(() => {
//           setSaveMessage('');
//         }, 2500);
//       } else {
//         console.error(
//           'Save failed:',
//           data.error
//         );

//         setSaveMessage('Unable to save');
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       setSaveMessage('Unable to save');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isMounted) {
//     return (
//       <div className="canvas-loading">
//         <div className="notes-spinner" />
//         <p>Loading canvas...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="excalidraw-container">
//       <div
//         className="excalidraw-surface"
//         key={`canvas-${noteId}`}
//       >
//         {hasLoaded && (
//           <Excalidraw
//             key={noteId || 'empty'}
//             initialData={{
//               elements: elements as any,
//             }}
//             onChange={(newElements: any) => setElements(newElements as any)}
//           />
//         )}
//       </div>

//       <div className="canvas-bottom-bar">
//         <div className="canvas-save-info">
//           {saveMessage ? (
//             <>
//               <span
//                 className={`save-status-icon ${
//                   saveMessage === 'Saved successfully'
//                     ? 'save-success'
//                     : 'save-error'
//                 }`}
//               >
//                 {saveMessage ===
//                 'Saved successfully'
//                   ? '✓'
//                   : '!'}
//               </span>

//               <span>{saveMessage}</span>
//             </>
//           ) : (
//             <>
//               <span className="canvas-hint-dot" />
//               <span>
//                 Changes are saved manually
//               </span>
//             </>
//           )}
//         </div>

//         <button
//           type="button"
//           onClick={handleSave}
//           disabled={
//             loading ||
//             !noteId ||
//             !hasLoaded
//           }
//           className="canvas-save-button"
//         >
//           {loading ? (
//             <>
//               <span className="save-button-spinner" />
//               Saving...
//             </>
//           ) : (
//             <>
//               <svg
//                 width="17"
//                 height="17"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
//                 <path d="M17 21v-8H7v8" />
//                 <path d="M7 3v5h8" />
//               </svg>

//               Save
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }
// frontend/src/components/ExcalidrawCanvas.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExcalidrawElement {
  id: string;
  type: string;
  [key: string]: any;
}

interface ExcalidrawContent {
  type: string;
  elements: ExcalidrawElement[];
}

interface ExcalidrawCanvasProps {
  noteId: number | null;
  userId: number;
  initialContent: ExcalidrawContent | null;
  onSave: (updatedNote: any) => void;
}

const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw').then(
      (mod) => mod.Excalidraw
    ),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading">
        <div className="notes-spinner" />
        <p>Loading canvas...</p>
      </div>
    ),
  }
);

import '@excalidraw/excalidraw/index.css';

export default function ExcalidrawCanvas({
  noteId,
  userId,
  initialContent,
  onSave,
}: ExcalidrawCanvasProps) {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const currentNoteIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const noteChanged = noteId !== currentNoteIdRef.current;

    if (noteChanged) {
      setElements([]);
      setHasLoaded(false);
      setSaveMessage('');

      if (initialContent) {
        try {
          const parsed = typeof initialContent === 'string'
            ? JSON.parse(initialContent)
            : initialContent;

          const loadedElements = parsed?.elements || [];
          setElements(loadedElements);
          setHasLoaded(true);
        } catch (error) {
          console.error('Error parsing content:', error);
          setElements([]);
          setHasLoaded(true);
        }
      } else {
        setHasLoaded(true);
      }

      currentNoteIdRef.current = noteId;
    }
  }, [noteId, initialContent, isMounted]);

  const handleSave = async (): Promise<void> => {
    if (!noteId) {
      console.error('No note ID');
      return;
    }

    setLoading(true);
    setSaveMessage('');

    try {
      const response = await fetch(`/api/canvas/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          content: { type: 'excalidraw', elements },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage('Saved successfully');
        onSave(data.data);
        setTimeout(() => setSaveMessage(''), 2500);
      } else {
        console.error('Save failed:', data.error);
        setSaveMessage('Unable to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Unable to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (): Promise<void> => {
    if (!canvasRef.current) {
      alert('Canvas not ready for download');
      return;
    }

    setDownloadLoading(true);

    try {
      // Get the Excalidraw container
      const canvasElement = canvasRef.current.querySelector('.excalidraw') as HTMLElement;
      
      if (!canvasElement) {
        alert('Could not find canvas content');
        setDownloadLoading(false);
        return;
      }

      // Find the actual drawing area
      const drawingArea = canvasElement.querySelector('.excalidraw-canvas-container') || canvasElement;

      // Use html2canvas to capture the drawing
      const canvas = await html2canvas(drawingArea as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`note-${noteId || 'canvas'}-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="canvas-loading">
        <div className="notes-spinner" />
        <p>Loading canvas...</p>
      </div>
    );
  }

  return (
    <div className="excalidraw-container" ref={canvasRef}>
      <div className="excalidraw-surface" key={`canvas-${noteId}`}>
        {hasLoaded && (
          <Excalidraw
            key={noteId || 'empty'}
            initialData={{ elements }}
            onChange={setElements}
          />
        )}
      </div>

      <div className="canvas-bottom-bar">
        <div className="canvas-save-info">
          {saveMessage ? (
            <>
              <span className={`save-status-icon ${
                saveMessage === 'Saved successfully' ? 'save-success' : 'save-error'
              }`}>
                {saveMessage === 'Saved successfully' ? '✓' : '!'}
              </span>
              <span>{saveMessage}</span>
            </>
          ) : (
            <>
              <span className="canvas-hint-dot" />
              <span>Changes are saved manually</span>
            </>
          )}
        </div>

        <div className="canvas-actions" >
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !noteId || !hasLoaded}
            className="canvas-save-button"
          >
            {loading ? (
              <>
                <span className="save-button-spinner" />
                Saving...
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                  <path d="M17 21v-8H7v8" />
                  <path d="M7 3v5h8" />
                </svg>
                Save
              </>
            )}
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadLoading || !noteId || !hasLoaded}
            className="canvas-save-button"
          >
            {downloadLoading ? (
              <>
                <span className="save-button-spinner" />
                Generating PDF...
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}