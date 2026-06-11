'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import type { ExportRecordRequest } from '../types/patient.type';

interface ExportPDFDialogProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPDFDialog = ({
  patientId,
  isOpen,
  onClose,
}: ExportPDFDialogProps) => {
  const { exportRecords, downloadPdf, isExportingRecords, isDownloadingPdf } =
    usePatient();
  const [exportOptions, setExportOptions] = useState<ExportRecordRequest>({
    patientId,
    includeHistory: true,
    includeTreatments: true,
    includeImages: false,
  });

  const [exportResult, setExportResult] = useState<{
    fileName: string;
    downloadUrl: string;
  } | null>(null);

  const handleExport = async () => {
    try {
      const result = await exportRecords(exportOptions);
      setExportResult({
        fileName: result.data.fileName,
        downloadUrl: result.data.downloadUrl,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Có lỗi xảy ra khi xuất PDF');
    }
  };

  const handleDownload = async () => {
    if (!exportResult) return;

    try {
      const blob = await downloadPdf(exportResult.fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportResult.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Đã tải xuống PDF thành công!');
      onClose();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Có lỗi xảy ra khi tải PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:file-pdf-box" width={32} />
              <div>
                <h3 className="text-xl font-bold">Xuất hồ sơ bệnh án</h3>
                <p className="text-blue-100 text-sm mt-1">
                  Tạo file PDF chứa đầy đủ thông tin bệnh án
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <Icon icon="mdi:close" width={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!exportResult ? (
            <>
              {/* Export Options */}
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      icon="mdi:information"
                      width={24}
                      className="text-blue-600 flex-shrink-0"
                    />
                    <div className="text-sm text-blue-900">
                      <div className="font-medium mb-1">Nội dung xuất PDF</div>
                      <p>
                        Chọn các thông tin bạn muốn đưa vào file PDF. File sẽ
                        bao gồm thông tin bệnh nhân, bệnh sử và các nội dung đã
                        chọn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeHistory}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          includeHistory: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          icon="mdi:clipboard-text"
                          width={20}
                          className="text-gray-600"
                        />
                        <span className="font-medium text-gray-800">
                          Bệnh sử
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Bao gồm tiền sử bệnh, dị ứng, bệnh mãn tính, thuốc đang
                        dùng
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTreatments}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          includeTreatments: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          icon="mdi:medical-bag"
                          width={20}
                          className="text-gray-600"
                        />
                        <span className="font-medium text-gray-800">
                          Lịch sử điều trị
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Danh sách các lần điều trị, thủ thuật đã thực hiện
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeImages}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          includeImages: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          icon="mdi:image"
                          width={20}
                          className="text-gray-600"
                        />
                        <span className="font-medium text-gray-800">
                          Hình ảnh X-quang
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Hình ảnh chụp X-quang, CBCT (có thể làm file PDF lớn
                        hơn)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleExport}
                disabled={isExportingRecords}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isExportingRecords ? (
                  <>
                    <Icon icon="line-md:loading-twotone-loop" width={24} />
                    Đang tạo PDF...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:file-export" width={24} />
                    Tạo file PDF
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Export Success */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="mdi:check-circle"
                    width={48}
                    className="text-green-600"
                  />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  Tạo PDF thành công!
                </h4>
                <p className="text-gray-600 mb-6">
                  File PDF đã được tạo và sẵn sàng để tải xuống
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon
                        icon="mdi:file-pdf-box"
                        width={32}
                        className="text-red-600"
                      />
                      <div className="text-left">
                        <div className="font-medium text-gray-800">
                          {exportResult.fileName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Hồ sơ bệnh án
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloadingPdf}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDownloadingPdf ? (
                      <>
                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Icon icon="mdi:download" width={20} />
                        Tải xuống
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
