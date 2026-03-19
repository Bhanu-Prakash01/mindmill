import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services';
import { Link } from 'react-router-dom';
import {
 Ticket,
 Plus,
 Search,
 Filter,
 MessageCircle,
 Clock,
 AlertCircle,
 CheckCircle,
 XCircle,
 User,
 Tag,
 ArrowRight
} from 'lucide-react';

const Support = () => {
 const { user } = useAuth();
 const [tickets, setTickets] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterStatus, setFilterStatus] = useState('all');
 const [filterPriority, setFilterPriority] = useState('all');
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [createForm, setCreateForm] = useState({
 subject: '',
 message: '',
 category: 'general',
 priority: 'medium',
 });
 const [submitting, setSubmitting] = useState(false);

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

 useEffect(() => {
 fetchTickets();
 }, []);

 const fetchTickets = async () => {
 try {
 setLoading(true);
 const response = isAdmin
 ? await supportService.getTickets()
 : await supportService.getMyTickets();
 setTickets(response.data?.tickets || []);
 } catch (error) {
 console.error('Error fetching tickets:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleCreateTicket = async (e) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 await supportService.createTicket(createForm);
 setShowCreateModal(false);
 setCreateForm({ subject: '', message: '', category: 'general', priority: 'medium' });
 fetchTickets();
 } catch (error) {
 console.error('Error creating ticket:', error);
 alert(error.response?.data?.message || 'Failed to create ticket');
 } finally {
 setSubmitting(false);
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
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
 {labels[status] || status}
 </span>
 );
 };

 const getPriorityBadge = (priority) => {
 const styles = {
 low: 'bg-gray-100 text-gray-700 ',
 medium: 'bg-blue-100 text-blue-700 ',
 high: 'bg-orange-100 text-orange-700 ',
 urgent: 'bg-red-100 text-red-700 ',
 };
 return (
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || styles.medium}`}>
 {priority.charAt(0).toUpperCase() + priority.slice(1)}
 </span>
 );
 };

 const getCategoryIcon = (category) => {
 const icons = {
 technical: <AlertCircle className="w-4 h-4" />,
 billing: <Ticket className="w-4 h-4" />,
 general: <MessageCircle className="w-4 h-4" />,
 complaint: <XCircle className="w-4 h-4" />,
 feature_request: <Plus className="w-4 h-4" />,
 assessment_issue: <Ticket className="w-4 h-4" />,
 };
 return icons[category] || <MessageCircle className="w-4 h-4" />;
 };

 const filteredTickets = tickets.filter(ticket => {
 const matchesSearch =
 ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
 ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
 const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
 return matchesSearch && matchesStatus && matchesPriority;
 });

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Support Tickets</h1>
 <p className="text-gray-500 mt-1">Get help and track your requests</p>
 </div>
 <button
 onClick={() => setShowCreateModal(true)}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
 >
 <Plus className="w-4 h-4 mr-2" />
 New Ticket
 </button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 { label: 'Open', count: tickets.filter(t => t.status === 'open').length, color: 'blue' },
 { label: 'In Progress', count: tickets.filter(t => t.status === 'in-progress').length, color: 'yellow' },
 { label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length, color: 'green' },
 { label: 'Total', count: tickets.length, color: 'gray' },
 ].map((stat) => (
 <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
 <p className="text-sm text-gray-500 ">{stat.label}</p>
 <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
 </div>
 ))}
 </div>

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder="Search tickets..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 />
 </div>
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="all">All Status</option>
 <option value="open">Open</option>
 <option value="in-progress">In Progress</option>
 <option value="waiting">Waiting</option>
 <option value="resolved">Resolved</option>
 <option value="closed">Closed</option>
 </select>
 <select
 value={filterPriority}
 onChange={(e) => setFilterPriority(e.target.value)}
 className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="all">All Priorities</option>
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 <option value="urgent">Urgent</option>
 </select>
 </div>

 {/* Tickets List */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 ">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
 {!isAdmin && (
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
 )}
 {isAdmin && (
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
 )}
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 ">
 {filteredTickets.map((ticket) => (
 <tr key={ticket._id} className="hover:bg-gray-50 ">
 <td className="px-6 py-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs text-gray-500 ">{ticket.ticketNumber}</span>
 {ticket.responses?.length > 0 && (
 <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
 {ticket.responses.length} reply{ticket.responses.length !== 1 ? 'ies' : 'y'}
 </span>
 )}
 </div>
 <div className="text-sm font-medium text-gray-900 mt-1">
 {ticket.subject}
 </div>
 </div>
 </td>
 {!isAdmin && (
 <td className="px-6 py-4">
 <div className="flex items-center gap-2 text-sm text-gray-600 ">
 {getCategoryIcon(ticket.category)}
 <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
 </div>
 </td>
 )}
 {isAdmin && (
 <td className="px-6 py-4">
 <div className="flex items-center">
 <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
 <span className="text-indigo-600 text-xs font-medium">
 {ticket.user?.firstName?.[0]}{ticket.user?.lastName?.[0]}
 </span>
 </div>
 <div className="ml-3">
 <div className="text-sm text-gray-900 ">
 {ticket.user?.firstName} {ticket.user?.lastName}
 </div>
 </div>
 </div>
 </td>
 )}
 <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
 <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
 <td className="px-6 py-4 text-sm text-gray-500 ">
 {new Date(ticket.updatedAt).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 text-right">
 <Link
 to={`/support/${ticket._id}`}
 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
 >
 <span className="text-sm">View</span>
 <ArrowRight className="w-4 h-4" />
 </Link>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {filteredTickets.length === 0 && (
 <div className="text-center py-12">
 <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 ">No tickets found</p>
 </div>
 )}
 </div>

 {/* Create Ticket Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl max-w-lg w-full p-6">
 <h2 className="text-xl font-bold text-gray-900 mb-4">Create Support Ticket</h2>
 <form onSubmit={handleCreateTicket} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Subject
 </label>
 <input
 type="text"
 required
 value={createForm.subject}
 onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Brief description of your issue"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Category
 </label>
 <select
 value={createForm.category}
 onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="general">General</option>
 <option value="technical">Technical</option>
 <option value="billing">Billing</option>
 <option value="assessment_issue">Assessment Issue</option>
 <option value="feature_request">Feature Request</option>
 <option value="complaint">Complaint</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Priority
 </label>
 <select
 value={createForm.priority}
 onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 <option value="urgent">Urgent</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Message
 </label>
 <textarea
 required
 rows={4}
 value={createForm.message}
 onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Describe your issue in detail..."
 />
 </div>
 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={() => setShowCreateModal(false)}
 className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 {submitting ? 'Creating...' : 'Create Ticket'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default Support;
