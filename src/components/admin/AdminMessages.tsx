"use client";

import { useCallback, useEffect, useState } from 'react';
import { Trash2, Eye, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  mobileNumber?: string;
  productName?: string;
  selectedColor?: string;
  phoneNumber?: string;
  description?: string;
  messageType?: string;
  createdAt: string;
};

type PaginatedResponse = {
  messages: ContactMessage[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const AdminMessages = () => {
  const token = useStore((s) => s.token);
  const isAdmin = useStore((s) => s.isAdmin);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'product-inquiry'>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [messageToView, setMessageToView] = useState<ContactMessage | null>(null);

  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null) ||
    (isLoggedIn && isAdmin ? 'admin-token' : null);

  const loadMessages = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (filterType === 'product-inquiry') {
        params.set('messageType', 'Product Inquiry');
      }

      const res = await fetch(`/api/admin/contact-messages?${params.toString()}`, {
        headers: authToken ? { authorization: `Bearer ${authToken}` } : undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load messages');
        return;
      }

      const paginatedData: PaginatedResponse = data;
      setMessages(paginatedData.messages || []);
      setCurrentPage(paginatedData.currentPage);
      setTotalPages(paginatedData.totalPages);
      setTotalMessages(paginatedData.totalMessages);
      setHasNextPage(paginatedData.hasNextPage);
      setHasPreviousPage(paginatedData.hasPreviousPage);
    } catch {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [authToken, filterType]);

  useEffect(() => {
    loadMessages(currentPage);
  }, [authToken, currentPage, filterType]);

  const handleFilterChange = (newFilter: 'all' | 'product-inquiry') => {
    setFilterType(newFilter);
    setCurrentPage(1);
  };

  const handleCopyMobile = async (message: ContactMessage) => {
    if (!message.mobileNumber) return;

    try {
      await navigator.clipboard.writeText(message.mobileNumber);
      setCopiedId(message._id);
      toast({ title: 'Mobile number copied', description: message.mobileNumber });
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({ title: 'Unable to copy mobile number', variant: 'destructive' });
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${messageToDelete}`, {
        method: 'DELETE',
        headers: authToken ? { authorization: `Bearer ${authToken}` } : undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Failed to delete message', variant: 'destructive' });
        return;
      }

      toast({ title: 'Message deleted successfully' });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);

      // Handle edge case: if last message on page is deleted, go to previous page
      if (messages.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        await loadMessages(currentPage - 1);
      } else {
        await loadMessages(currentPage);
      }
    } catch {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadMessages(page);
    }
  };

  const openDeleteDialog = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const openViewDialog = (message: ContactMessage) => {
    setMessageToView(message);
    setViewDialogOpen(true);
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Contact Messages</h1>

      {/* Filter Section */}
      <div className="mb-6 bg-card rounded-xl p-4 border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Filter Messages:</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="messageFilter"
                value="all"
                checked={filterType === 'all'}
                onChange={() => handleFilterChange('all')}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="text-sm">All Messages</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="messageFilter"
                value="product-inquiry"
                checked={filterType === 'product-inquiry'}
                onChange={() => handleFilterChange('product-inquiry')}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="text-sm">Product Inquiry</span>
            </label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-destructive">{error}</div>
      ) : messages.length === 0 ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-muted-foreground">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m._id} className="bg-card rounded-xl p-4 border border-border">
              {m.messageType === 'Product Inquiry' ? (
                // Compact Product Inquiry Card
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium truncate">{m.productName || m.name}</p>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary shrink-0">
                        Product Inquiry
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => openViewDialog(m)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deleteDialogOpen && messageToDelete === m._id} onOpenChange={(open) => {
                      if (!open) {
                        setDeleteDialogOpen(false);
                        setMessageToDelete(null);
                      }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(m._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this message?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteMessage}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                // Regular Contact Message Card
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{m.name}</p>
                        {m.messageType && m.messageType !== 'Contact' ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {m.messageType}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground break-all">{m.email}</p>
                      {m.mobileNumber ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-foreground">Mobile: {m.mobileNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMobile(m)}
                            className="text-xs text-primary underline-offset-4 hover:underline"
                          >
                            {copiedId === m._id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">No mobile number provided</p>
                      )}
                      {m.productName ? (
                        <p className="mt-2 text-sm text-foreground">Product: {m.productName}</p>
                      ) : null}
                      {m.selectedColor ? (
                        <p className="text-sm text-foreground">Color: {m.selectedColor}</p>
                      ) : null}
                      {m.description ? (
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{m.description}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                      </p>
                      <AlertDialog open={deleteDialogOpen && messageToDelete === m._id} onOpenChange={(open) => {
                        if (!open) {
                          setDeleteDialogOpen(false);
                          setMessageToDelete(null);
                        }
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(m._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteMessage}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{m.message}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Product Inquiry View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Inquiry Details</DialogTitle>
            <DialogDescription>
              Complete inquiry information
            </DialogDescription>
          </DialogHeader>
          {messageToView && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Product Name</p>
                <p className="text-sm font-medium">{messageToView.productName || messageToView.name}</p>
              </div>
              {messageToView.selectedColor && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Selected Color</p>
                  <p className="text-sm">{messageToView.selectedColor}</p>
                </div>
              )}
              {messageToView.mobileNumber && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Customer Mobile Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{messageToView.mobileNumber}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyMobile(messageToView)}
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {copiedId === messageToView._id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              {messageToView.name && messageToView.name !== messageToView.productName && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Customer Name</p>
                  <p className="text-sm">{messageToView.name}</p>
                </div>
              )}
              {messageToView.email && messageToView.email !== 'product-inquiry@local' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email</p>
                  <p className="text-sm break-all">{messageToView.email}</p>
                </div>
              )}
              {messageToView.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{messageToView.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Date & Time</p>
                <p className="text-sm">
                  {messageToView.createdAt ? new Date(messageToView.createdAt).toLocaleString() : ''}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMessages;
