'use client';

import { useCallback, useEffect, useState, type InputHTMLAttributes } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadStatus = 'uploading' | 'success' | 'error';

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  message?: string;
  preview?: string;
  uploadFolderId?: string;
  relativePath?: string;
};

export default function UploadBox({ folderId }: { folderId: string }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(
    (upload: UploadItem) => {
      return new Promise<void>((resolve) => {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('folderId', upload.uploadFolderId ?? folderId);

        if (upload.relativePath) {
          formData.append('relativePath', upload.relativePath);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads((current) =>
              current.map((item) =>
                item.id === upload.id ? { ...item, progress } : item
              )
            );
          }
        };

        xhr.onload = () => {
          setUploads((current) =>
            current.map((item) =>
              item.id === upload.id
                ? {
                    ...item,
                    progress: xhr.status === 200 ? 100 : item.progress,
                    status: xhr.status === 200 ? 'success' : 'error',
                    message: xhr.status === 200 ? 'Uploaded' : `Upload failed (${xhr.status})`,
                  }
                : item
            )
          );
          resolve();
        };

        xhr.onerror = () => {
          setUploads((current) =>
            current.map((item) =>
              item.id === upload.id
                ? { ...item, status: 'error', message: 'Upload failed. Check your connection.' }
                : item
            )
          );
          resolve();
        };

        xhr.send(formData);
      });
    },
    [folderId]
  );

  const onDrop = useCallback(
    async (files: File[], _fileRejections: any) => {
      const normalizedPaths = files
        .map((file) => (file as any).webkitRelativePath || '')
        .filter(Boolean)
        .map((path) => path.replace(/\\/g, '/').replace(/^\/+/, ''));

      const rootFolderName = (() => {
        if (!normalizedPaths.length) return undefined;

        const firstSegments = normalizedPaths.map((path) => path.split('/').filter(Boolean)[0]);
        return firstSegments.every((segment) => segment === firstSegments[0])
          ? firstSegments[0]
          : undefined;
      })();

      let uploadFolderId: string | undefined;
      if (rootFolderName) {
        const initFormData = new FormData();
        initFormData.append('folderId', folderId);
        initFormData.append('rootFolderName', rootFolderName);

        const initResponse = await fetch('/api/upload/init', {
          method: 'POST',
          body: initFormData,
        });

        if (initResponse.ok) {
          const data = await initResponse.json();
          uploadFolderId = data.rootFolderId;
        }
      }

      const newUploads = files.map((file) => {
        const rawRelativePath = (file as any).webkitRelativePath || '';
        const normalizedRawPath = rawRelativePath.replace(/\\/g, '/').replace(/^\/+/, '');
        const relativePath = rootFolderName
          ? normalizedRawPath.replace(new RegExp(`^${rootFolderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`), '')
          : normalizedRawPath;

        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          progress: 0,
          status: 'uploading' as UploadStatus,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          uploadFolderId,
          relativePath: relativePath || undefined,
        };
      });

      setUploads((current) => [...newUploads, ...current]);
      for (const upload of newUploads) {
        await uploadFile(upload);
      }
    },
    [uploadFile, folderId]
  );

  useEffect(() => {
    return () => {
      uploads.forEach((upload) => {
        if (upload.preview) {
          URL.revokeObjectURL(upload.preview);
        }
      });
    };
  }, [uploads]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    noKeyboard: false,
  });

  return (
    <div className='space-y-5'>
      <div
        {...getRootProps()}
        className={`rounded-[1.75rem] border-2 p-10 text-center transition border-dashed ${
          isDragActive || isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800 bg-slate-950/80'
        } ${isDragReject ? 'border-rose-400 bg-rose-500/10' : ''}`}
      >
        <input {...(getInputProps() as any)} webkitdirectory="true" directory="true" />
        <div className='mx-auto max-w-xl space-y-3'>
          <p className='text-xl font-semibold text-slate-50'>Drag save files or folders here to upload</p>
        </div>
      </div>

      <div className='space-y-4'>
        {uploads.map((upload) => (
          <div key={upload.id} className='rounded-3xl border border-slate-800 bg-slate-900/80 p-4'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-4'>
                {upload.preview ? (
                  <img src={upload.preview} alt={upload.file.name} className='h-14 w-14 rounded-2xl object-cover' />
                ) : (
                  <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-sm text-slate-400'>
                    {upload.file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                )}
                <div>
                  <p className='font-semibold text-slate-100'>{upload.file.name}</p>
                  <p className='text-sm text-slate-500'>
                    {upload.status === 'uploading' && 'Uploading...'}
                    {upload.status === 'success' && 'Completed'}
                    {upload.status === 'error' && upload.message}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                upload.status === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : upload.status === 'error'
                  ? 'bg-rose-500/15 text-rose-300'
                  : 'bg-cyan-500/15 text-cyan-300'
              }`}>
                {upload.status.toUpperCase()}
              </span>
            </div>
            <div className='mt-4 h-2 overflow-hidden rounded-full bg-slate-800'>
              <div
                className='h-full rounded-full bg-cyan-400 transition-all duration-300'
                style={{ width: `${Math.min(upload.progress, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
