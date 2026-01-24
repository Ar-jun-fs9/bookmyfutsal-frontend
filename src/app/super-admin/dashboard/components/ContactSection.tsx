import { useState, useEffect } from 'react';
import { useContacts } from '../hooks/useContacts';
import { ConfirmModal } from './modals/ConfirmModal';
import { NotificationModal } from './modals/NotificationModal';

interface ContactSectionProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  ip_address: string;
  user_agent: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function ContactSection({ isVisible, onToggle }: ContactSectionProps) {
  const { contacts, loading, deleteContact, markAsRead, refetch } = useContacts();
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });
  const [viewModal, setViewModal] = useState<{ isOpen: boolean, contact: Contact | null }>({ isOpen: false, contact: null });

  // Auto-hide notifications after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeleteContact = (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this contact message?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } });
        const result = await deleteContact(id);
        if (result.success) {
          setNotification({ message: 'Contact message deleted successfully', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Error deleting contact message', type: 'info' });
        }
      }
    });
  };

  const handleViewContact = (contact: Contact) => {
    setViewModal({ isOpen: true, contact });
    // Mark as read when viewing
    if (!contact.is_read) {
      markAsRead(contact.id, true);
    }
  };

  const handleToggleReadStatus = async (contact: Contact) => {
    const result = await markAsRead(contact.id, !contact.is_read);
    if (result.success) {
      setNotification({
        message: `Contact marked as ${!contact.is_read ? 'read' : 'unread'}`,
        type: 'success'
      });
    } else {
      setNotification({ message: result.error || 'Error updating contact status', type: 'info' });
    }
  };

  if (!isVisible) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Contact Messages</h3>
          <button onClick={onToggle} className="bg-linear-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-400/30 hover:border-blue-400/50">
            Show Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Contact Messages</h3>
        <button onClick={onToggle} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Hide Contact Messages
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Loading contact messages...</p>
        ) : contacts.length === 0 ? (
          <p>No contact messages found.</p>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className={`border rounded p-4 flex flex-col md:flex-row md:justify-between md:items-start ${contact.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <p className='font-semibold mr-2'><strong>{contact.name}</strong></p>
                  {!contact.is_read && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                  )}
                </div>
                <p className='mb-1'><strong>Email:</strong> {contact.email}</p>
                {contact.subject && <p className='mb-1'><strong>Subject:</strong> {contact.subject}</p>}
                {contact.phone && <p className='mb-1'><strong>Phone:</strong> {contact.phone}</p>}
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Date:</strong>{" "}
                  {new Date(contact.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).replace(/\//g, "-").replace(/\b(am|pm)\b/g, m => m.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  <strong>Message:</strong> {contact.message.length > 100 ? `${contact.message.substring(0, 100)}...` : contact.message}
                </p>
              </div>
              <div className="flex flex-row space-x-2 mt-4 md:ml-4 md:mt-0 md:items-center">
                <button
                  onClick={() => handleViewContact(contact)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleToggleReadStatus(contact)}
                  className={`px-3 py-1 rounded text-sm text-white ${contact.is_read ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {contact.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Modal */}
      {viewModal.isOpen && viewModal.contact && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Contact Message Details</h3>
              <button
                onClick={() => setViewModal({ isOpen: false, contact: null })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p><strong>Name:</strong> {viewModal.contact.name}</p>
              <p><strong>Email:</strong> {viewModal.contact.email}</p>
              {viewModal.contact.subject && <p><strong>Subject:</strong> {viewModal.contact.subject}</p>}
              {viewModal.contact.phone && <p><strong>Phone:</strong> {viewModal.contact.phone}</p>}
              <p><strong>Message:</strong></p>
              <div className="bg-gray-50 p-4 rounded border">
                {viewModal.contact.message}
              </div>
              <p><strong>Date:</strong> {new Date(viewModal.contact.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).replace(/\//g, "-").replace(/\b(am|pm)\b/g, m => m.toUpperCase())}</p>
              <p><strong>IP Address:</strong> {viewModal.contact.ip_address}</p>
              <p><strong>Status:</strong> <span className={viewModal.contact.is_read ? 'text-green-600' : 'text-blue-600'}>{viewModal.contact.is_read ? 'Read' : 'Unread'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => { } })}
      />

      <NotificationModal
        isOpen={!!notification}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}