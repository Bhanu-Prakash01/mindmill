import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supportService } from '../../services';
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Tag,
  MoreVertical,
  Paperclip
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const TicketDetail = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const goBack = () => {
    const path = window.location.pathname;
    if (path.startsWith('/individual/')) {
      navigate('/individual/support');
    } else if (orgSlug) {
      navigate(`/o/${orgSlug}/support`);
    } else {
      navigate('/support');
    }
  };
  const messagesEndRef = useRef(null);

 const [ticket, setTicket] = useState(null);
 const [loading, setLoading] = useState(true);
 const [newMessage, setNewMessage] = useState('');
 const [sending, setSending] = useState(false);
 const [updatingStatus, setUpdatingStatus] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [assigningCoordinator, setAssigningCoordinator] = useState(false);
  const [escalating, setEscalating] = useState(false);

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

 useEffect(() => {
 fetchTicket();
 if (isAdmin) {
 fetchCoordinators();
 }
 }, [id]);

 useEffect(() => {
 scrollToBottom();
 }, [ticket?.responses]);

 const fetchTicket = async () => {
 try {
 setLoading(true);
 const response = await supportService.getTicket(id);
 setTicket(response.data?.ticket);
} catch (error) {
  console.error('Error fetching ticket:', error);
  toast.error('Failed to load ticket');
  } finally {
 setLoading(false);
 }
 };

 const fetchCoordinators = async () => {
 try {
 const response = await supportService.getCoordinators();
 setCoordinators(response.data?.coordinators || []);
 } catch (error) {
 console.error('Error fetching coordinators:', error);
 }
 };

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 const handleSendMessage = async (e) => {
 e.preventDefault();
 if (!newMessage.trim()) return;

 setSending(true);
 try {
 await supportService.addResponse(id, newMessage, false);
 setNewMessage('');
 fetchTicket();
} catch (error) {
  console.error('Error sending message:', error);
  toast.error('Failed to send message');
  } finally {
 setSending(false);
 }
 };

 const handleUpdateStatus = async (status) => {
 setUpdatingStatus(true);
 try {
 await supportService.updateStatus(id, status);
 fetchTicket();
} catch (error) {
  console.error('Error updating status:', error);
  toast.error('Failed to update status');
  } finally {
 setUpdatingStatus(false);
 }
 };

  const handleAssignCoordinator = async (userId) => {
    if (!userId) return;
    setAssigningCoordinator(true);
    try {
      await supportService.assignTicket(id, userId);
      fetchTicket();
    } catch (error) {
      console.error('Error assigning coordinator:', error);
      toast.error('Failed to assign coordinator');
    } finally {
      setAssigningCoordinator(false);
    }
  };

  const handleEscalate = async () => {
    if (!window.confirm('Escalate this ticket to SuperAdmin? This will flag it for immediate attention.')) return;
    setEscalating(true);
    try {
      const res = await supportService.escalateTicket(id, true);
      toast.success(res.message || 'Ticket escalated');
      fetchTicket();
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast.error('Failed to escalate ticket');
    } finally {
      setEscalating(false);
    }
  };

  const handleDeEscalate = async () => {
    if (!window.confirm('Remove escalation from this ticket?')) return;
    setEscalating(true);
    try {
      const res = await supportService.escalateTicket(id, false);
      toast.success(res.message || 'Escalation removed');
      fetchTicket();
    } catch (error) {
      console.error('Error removing escalation:', error);
      toast.error('Failed to remove escalation');
    } finally {
      setEscalating(false);
    }
  };

 const getStatusBadge = (status) => {
 const styles = {
 open: 'bg-blue-100 text-blue-700 ',
 'in-progress': 'bg-yellow-100 text-yellow-700 ',
 waiting: 'bg-orange-100 text-orange-700 ',
 resolved: 'bg-green-100 text-green-700 ',
 closed: 'bg-gray-100 text-gray-700 ',
 };
 const labels = {
 open: 'Open',
 'in-progress': 'In Progress',
 waiting: 'Waiting',
 resolved: 'Resolved',
 closed: 'Closed',
 };
 return (
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.open}`}>
 {labels[status] || status}
 </span>
 );
 };

 const getPriorityBadge = (priority) => {
 const styles = {
 medium: 'bg-blue-100 text-blue-700 ',
 high: 'bg-orange-100 text-orange-700 ',
 urgent: 'bg-red-100 text-red-700 ',
 };
 return (
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[priority] || styles.medium}`}>
 {priority.charAt(0).toUpperCase() + priority.slice(1)}
 </span>
 );
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
 </div>
 );
 }

 if (!ticket) {
 return (
 <div className="text-center py-12">
 <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 ">Ticket not found</p>
 </div>
 );
 }

 const allMessages = [
 { ...ticket, isOriginal: true },
 ...(ticket.responses || [])
 ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-4">
          <button
              onClick={goBack}
              className="p-2 text-gray-500 hover:text-gray-700 "
            >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-xl font-bold text-gray-900 ">{ticket.subject}</h1>
 {getStatusBadge(ticket.status)}
 </div>
 <p className="text-sm text-gray-500 mt-1">
 {ticket.ticketNumber} • Created {new Date(ticket.createdAt).toLocaleDateString()}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {getPriorityBadge(ticket.priority)}
 {isAdmin && (
 <select
 value={ticket.status}
 onChange={(e) => handleUpdateStatus(e.target.value)}
 disabled={updatingStatus}
 className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="open">Open</option>
 <option value="in-progress">In Progress</option>
 <option value="waiting">Waiting</option>
 <option value="resolved">Resolved</option>
 <option value="closed">Closed</option>
 </select>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Messages */}
 <div className="lg:col-span-2 space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 {/* Messages List */}
 <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
 {/* Show selected issues if any */}
 {ticket.selectedIssues?.length > 0 && (
 <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
 <p className="text-sm font-medium text-indigo-900 mb-2">Reported Issues:</p>
 <ul className="space-y-1">
 {ticket.selectedIssues.map((issue, i) => (
 <li key={i} className="text-sm text-indigo-700 flex items-center gap-2">
 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
 {issue}
 </li>
 ))}
 </ul>
 </div>
 )}
 {allMessages.map((message, index) => (
 <div
 key={message._id || index}
 className={`flex gap-4 ${message.isOriginal ? '' : 'pl-8'}`}
 >
 <div className="flex-shrink-0">
 <UserAvatar
  name={message.isOriginal ? ticket.user?.firstName : message.from?.firstName}
  lastName={message.isOriginal ? ticket.user?.lastName : message.from?.lastName}
  email={message.isOriginal ? ticket.user?.email : message.from?.email}
  size={40}
 />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium text-gray-900 ">
 {message.isOriginal
 ? `${ticket.user?.firstName} ${ticket.user?.lastName}`
 : `${message.from?.firstName} ${message.from?.lastName}`
 }
 </span>
 <span className="text-xs text-gray-500 ">
 {new Date(message.createdAt).toLocaleString()}
 </span>
 {message.isInternal && (
 <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
 Internal
 </span>
 )}
 </div>
 <div className="text-gray-700 whitespace-pre-wrap">
 {message.isOriginal ? ticket.message : message.message}
 </div>
 {message.attachments?.length > 0 && (
 <div className="flex gap-2 mt-2">
 {message.attachments.map((attachment, i) => (
 <a
 key={i}
 href={attachment}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 "
 >
 <Paperclip className="w-3 h-3" />
 Attachment {i + 1}
 </a>
 ))}
 </div>
 )}
 </div>
 </div>
 ))}
 <div ref={messagesEndRef} />
 </div>

 {/* Reply Form */}
 {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
 <div className="border-t border-gray-200 p-4">
 <form onSubmit={handleSendMessage} className="flex gap-4">
 <input
 type="text"
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 placeholder="Type your message..."
 className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 <button
 type="submit"
 disabled={sending || !newMessage.trim()}
 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
 >
 <Send className="w-4 h-4" />
 {sending ? 'Sending...' : 'Send'}
 </button>
 </form>
 </div>
 )}
 </div>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Ticket Info */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Ticket Information</h3>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-gray-500 ">Category</span>
 <span className="text-gray-900 capitalize">{ticket.category.replace('_', ' ')}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-500 ">Priority</span>
 <span className="text-gray-900 capitalize">{ticket.priority}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-500 ">Status</span>
 <span className="text-gray-900 capitalize">{ticket.status}</span>
 </div>
 {ticket.assignedTo && (
 <div className="flex justify-between">
 <span className="text-gray-500 ">Assigned To</span>
 <span className="text-gray-900 ">
 {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
 </span>
 </div>
 )}
 {ticket.resolvedAt && (
 <div className="flex justify-between">
 <span className="text-gray-500 ">Resolved</span>
 <span className="text-gray-900 ">
 {new Date(ticket.resolvedAt).toLocaleDateString()}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Assign Coordinator - Admin Only */}
 {isAdmin && coordinators.length > 0 && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Assign Coordinator</h3>
 <select
 value={ticket.assignedTo?._id || ''}
 onChange={(e) => handleAssignCoordinator(e.target.value)}
 disabled={assigningCoordinator}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="">Select coordinator...</option>
 {coordinators.map((coord) => (
 <option key={coord._id} value={coord._id}>
 {coord.firstName} {coord.lastName}
 </option>
 ))}
 </select>
 </div>
 )}

  {/* Escalation - Admin Only */}
  {isAdmin && (
    <div className={`rounded-xl border p-6 ${ticket.escalated ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">SuperAdmin Escalation</h3>
        {ticket.escalated && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Escalated
          </span>
        )}
      </div>

      {ticket.escalated ? (
        <div className="space-y-2">
          {ticket.escalatedBy && (
            <p className="text-xs text-gray-500">
              Escalated by {ticket.escalatedBy.firstName} {ticket.escalatedBy.lastName}
              {ticket.escalatedAt && <> on {new Date(ticket.escalatedAt).toLocaleDateString()}</>}
            </p>
          )}
          {/* SuperAdmin can de-escalate; Admin who escalated can also de-escalate */}
          {(user.role === 'superadmin' || (user.role === 'admin' && ticket.escalatedBy?._id === user._id)) && (
            <button
              onClick={handleDeEscalate}
              disabled={escalating}
              className="w-full px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {escalating ? 'Removing...' : 'Remove Escalation'}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleEscalate}
          disabled={escalating || ticket.status === 'closed' || ticket.status === 'resolved'}
          className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {escalating ? 'Escalating...' : 'Escalate to SuperAdmin'}
        </button>
      )}
    </div>
  )}

  {/* User Info */}
  <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Requester</h3>
 <div className="flex items-center gap-3">
 <UserAvatar
  name={ticket.user?.firstName}
  lastName={ticket.user?.lastName}
  email={ticket.user?.email}
  size={40}
 />
 <div>
 <div className="text-sm font-medium text-gray-900 ">
 {ticket.user?.firstName} {ticket.user?.lastName}
 </div>
 <div className="text-xs text-gray-500 ">{ticket.user?.email}</div>
 </div>
 </div>
 </div>

 {/* Tags */}
 {ticket.tags?.length > 0 && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Tags</h3>
 <div className="flex flex-wrap gap-2">
 {ticket.tags.map((tag, i) => (
 <span
 key={i}
 className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Satisfaction */}
 {ticket.satisfactionRating && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Satisfaction Rating</h3>
 <div className="flex items-center gap-2">
 <div className="flex">
 {[1, 2, 3, 4, 5].map((star) => (
 <svg
 key={star}
 className={`w-5 h-5 ${
 star <= ticket.satisfactionRating
 ? 'text-yellow-400 fill-current'
 : 'text-gray-300'
 }`}
 viewBox="0 0 20 20"
 >
 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
 </svg>
 ))}
 </div>
 <span className="text-sm text-gray-600 ">
 {ticket.satisfactionRating}/5
 </span>
 </div>
 {ticket.satisfactionFeedback && (
 <p className="mt-2 text-sm text-gray-600 ">
 "{ticket.satisfactionFeedback}"
 </p>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default TicketDetail;
