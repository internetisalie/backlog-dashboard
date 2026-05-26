import React from 'react';
import Image from 'next/image';

interface BacklogConfig {
  name: string;
  path: string;
  icon?: string;
  backlogDir?: string;
}

interface ProjectSelectorProps {
  configs: BacklogConfig[];
  selectedProject: string;
  onSelect: (projectName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSelector({
  configs,
  selectedProject,
  onSelect,
  isOpen,
  onClose,
}: ProjectSelectorProps) {
  const handleSelect = (projectName: string) => {
    onSelect(projectName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#272930] border border-[#393c46] rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-[#e0e0e0]">
                Select Project
              </h2>
              <button
                onClick={onClose}
                className="text-[#a0a0a0] hover:text-[#e0e0e0] text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {configs.map((config) => (
                <button
                  key={config.name}
                  onClick={() => handleSelect(config.name)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center gap-3 ${
                    selectedProject === config.name
                      ? 'bg-[#4dabf7] text-[#1e1f24] font-medium'
                      : 'bg-[#1e1f24] text-[#e0e0e0] hover:bg-[#393c46]'
                  }`}
                >
                  {config.icon && (
                    <Image
                      src={config.icon}
                      alt={`${config.name} icon`}
                      width={24}
                      height={24}
                      className="w-6 h-6 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-[12px] opacity-75 mt-1">{config.path}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
