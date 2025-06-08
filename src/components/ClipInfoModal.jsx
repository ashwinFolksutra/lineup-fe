// ClipInfoModal.jsx - Modal component for displaying clip information
import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ClipInfoModal({ isOpen, onClose, clipData }) {
  const [open, setOpen] = useState(false)

  // Sync internal state with isOpen prop
  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-200 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-200 ease-in-out data-closed:translate-x-full sm:duration-300"
            >
              <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                <div className="px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-base font-semibold text-gray-900">
                      {clipData?.name || 'Clip Information'}
                    </DialogTitle>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  {clipData && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Clip Details</h3>
                        <dl className="mt-2 space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">Name:</dt>
                            <dd className="text-sm text-gray-900">{clipData.name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Type:</dt>
                            <dd className="text-sm text-gray-900">{clipData.clipType}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Start Time:</dt>
                            <dd className="text-sm text-gray-900">{(clipData.start || clipData.startTime || 0).toFixed(2)}s</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Duration:</dt>
                            <dd className="text-sm text-gray-900">{(clipData.duration || 0).toFixed(2)}s</dd>
                          </div>
                          {clipData.file && (
                            <div>
                              <dt className="text-sm text-gray-500">File Type:</dt>
                              <dd className="text-sm text-gray-900">{clipData.file.type}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}