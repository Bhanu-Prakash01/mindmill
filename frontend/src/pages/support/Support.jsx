import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supportService } from '../../services';
import { Link, useParams } from 'react-router-dom';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  MessageCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Tag,
  ArrowRight,
  SortAsc,
  SortDesc
} from 'lucide-react';

const Support = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { orgSlug } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterIssue, setFilterIssue] = useState('all');
  const [filterEscalated, setFilterEscalated] = useState('all');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
 const [standardQueries, setStandardQueries] = useState([]);
 const [createForm, setCreateForm] = useState({
 subject: '',
 message: '',
 category: 'general',
 priority: 'medium',
 selectedIssues: [],
 });
 const [showDescribeField, setShowDescribeField] = useState(false);
 const [submitting, setSubmitting] = useState(false);

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
  fetchTickets();
  fetchStandardQueries();
  }, []);

  // Re-sort tickets when sortField or sortDirection changes
  useEffect(() => {
  if (tickets.length > 0) {
    const sortedTickets = [...tickets].sort((a, b) => {
      if (user?.role === 'superadmin') {
        if (a.escalated && !b.escalated) return -1;
        if (!a.escalated && b.escalated) return 1;
      }
      
      let fieldA, fieldB;
      
      switch (sortField) {
        case 'ticketNumber':
          fieldA = a.ticketNumber || '';
          fieldB = b.ticketNumber || '';
          break;
        case 'category':
          fieldA = a.category || '';
          fieldB = b.category || '';
          break;
        case 'user':
          fieldA = a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() : '';
          fieldB = b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() : '';
          break;
        case 'status':
          fieldA = a.status || '';
          fieldB = b.status || '';
          break;
        case 'priority':
          const priorityValues = { urgent: 3, high: 2, medium: 1 };
          fieldA = priorityValues[a.priority] || 0;
          fieldB = priorityValues[b.priority] || 0;
          break;
        case 'subject':
          fieldA = a.subject || '';
          fieldB = b.subject || '';
          break;
        case 'createdAt':
          fieldA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          fieldB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'updatedAt':
        default:
          fieldA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          fieldB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
      }
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      }
      
      return 0;
    });
    setTickets(sortedTickets);
  }
  }, [sortField, sortDirection]);

  const fetchTickets = async () => {
  try {
  setLoading(true);
  const response = isAdmin
  ? await supportService.getTickets()
  : await supportService.getMyTickets();
  let ticketData = response.data?.tickets || [];
  
  // Sort tickets: escalated first for superadmin, then by field
  ticketData.sort((a, b) => {
    if (user?.role === 'superadmin') {
      if (a.escalated && !b.escalated) return -1;
      if (!a.escalated && b.escalated) return 1;
    }
    
    let fieldA, fieldB;
    
    // Map UI sort fields to actual data fields
    switch (sortField) {
      case 'ticketNumber':
        fieldA = a.ticketNumber || '';
        fieldB = b.ticketNumber || '';
        break;
      case 'category':
        fieldA = a.category || '';
        fieldB = b.category || '';
        break;
      case 'user':
        fieldA = a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() : '';
        fieldB = b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() : '';
        break;
      case 'status':
        fieldA = a.status || '';
        fieldB = b.status || '';
        break;
      case 'priority':
        const priorityValues = { urgent: 3, high: 2, medium: 1 };
        fieldA = priorityValues[a.priority] || 0;
        fieldB = priorityValues[b.priority] || 0;
        break;
      case 'updatedAt':
      default:
        fieldA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        fieldB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        break;
    }
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
    }
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    
    return 0;
  });
  
  setTickets(ticketData);
  } catch (error) {
  console.error('Error fetching tickets:', error);
  } finally {
  setLoading(false);
  }
  };

 const fetchStandardQueries = async () => {
 try {
 const response = await supportService.getStandardQueries();
 setStandardQueries(response.data?.queries || []);
 } catch (error) {
 console.error('Error fetching standard queries:', error);
 }
 };

 const handleIssueToggle = (label) => {
 const isSelected = createForm.selectedIssues.includes(label);
 let newSelectedIssues;

 if (isSelected) {
 newSelectedIssues = createForm.selectedIssues.filter(i => i !== label);
 } else {
 newSelectedIssues = [...createForm.selectedIssues, label];
 }

 setCreateForm({ ...createForm, selectedIssues: newSelectedIssues });

 // Check if "Others" is selected
 const hasOthers = newSelectedIssues.some(i =>
 i.toLowerCase() === 'others' || i.toLowerCase() === 'other'
 );
 setShowDescribeField(hasOthers);
 };

 const handleCreateTicket = async (e) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 // Build message from selected issues if not using describe field
 const payload = {
 ...createForm,
 message: showDescribeField
 ? createForm.message
 : createForm.selectedIssues.join('; ')
 };
  await supportService.createTicket(payload);
  setShowCreateModal(false);
  setCreateForm({
  subject: '',
  message: '',
  category: 'general',
  priority: 'medium',
  selectedIssues: [],
  });
  setShowDescribeField(false);
  fetchTickets();
} catch (error) {
  console.error('Error creating ticket:', error);
  toast.error(error.response?.data?.message || 'Failed to create ticket');
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
    const matchesIssue = filterIssue === 'all' || (ticket.selectedIssues && ticket.selectedIssues.includes(filterIssue));
    const matchesEscalated = filterEscalated === 'all' || (filterEscalated === 'yes' && ticket.escalated) || (filterEscalated === 'no' && !ticket.escalated);
    return matchesSearch && matchesStatus && matchesPriority && matchesIssue && matchesEscalated;
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
  <option value="medium">Medium</option>
  <option value="high">High</option>
  <option value="urgent">Urgent</option>
  </select>
  {isAdmin && (
    <select
      value={filterEscalated}
      onChange={(e) => setFilterEscalated(e.target.value)}
      className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
    >
      <option value="all">All Tickets</option>
      <option value="yes">Escalated Only</option>
      <option value="no">Not Escalated</option>
    </select>
  )}
  <select
    value={filterIssue}
    onChange={(e) => setFilterIssue(e.target.value)}
    className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
  >
    <option value="all">All Issues</option>
    {standardQueries.map((q) => (
      <option key={q._id} value={q.label}>{q.label}</option>
    ))}
  </select>
  <select
  value={sortField}
  onChange={(e) => setSortField(e.target.value)}
  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
  >
  <option value="updatedAt">Sort by: Updated</option>
  <option value="createdAt">Sort by: Created</option>
  <option value="priority">Sort by: Priority</option>
  <option value="status">Sort by: Status</option>
  <option value="subject">Sort by: Subject</option>
  </select>
  <button
  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
  className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-500 transition-colors"
  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
  >
  {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
  </button>
  </div>

 {/* Tickets List */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
  <thead className="bg-gray-50 ">
  <tr>
  <th 
    onClick={() => {
      setSortField(sortField === 'ticketNumber' ? 'ticketNumber' : 'ticketNumber');
      setSortDirection(sortField === 'ticketNumber' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'ticketNumber' ? 'text-indigo-600' : ''}`}
  >
    Ticket {sortField === 'ticketNumber' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
  {!isAdmin && (
  <th 
    onClick={() => {
      setSortField('category');
      setSortDirection(sortField === 'category' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'category' ? 'text-indigo-600' : ''}`}
  >
    Category {sortField === 'category' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
  )}
  {isAdmin && (
  <th 
    onClick={() => {
      setSortField('user');
      setSortDirection(sortField === 'user' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'user' ? 'text-indigo-600' : ''}`}
  >
    User {sortField === 'user' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
  )}
  <th 
    onClick={() => {
      setSortField('status');
      setSortDirection(sortField === 'status' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'status' ? 'text-indigo-600' : ''}`}
  >
    Status {sortField === 'status' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
  <th 
    onClick={() => {
      setSortField('priority');
      setSortDirection(sortField === 'priority' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'priority' ? 'text-indigo-600' : ''}`}
  >
    Priority {sortField === 'priority' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
  <th 
    onClick={() => {
      setSortField('updatedAt');
      setSortDirection(sortField === 'updatedAt' && sortDirection === 'asc' ? 'desc' : 'asc');
    }}
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${sortField === 'updatedAt' ? 'text-indigo-600' : ''}`}
  >
    Updated {sortField === 'updatedAt' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />)}
  </th>
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
        {ticket.escalated && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Escalated
          </span>
        )}
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
 {new Date(ticket.updatedAt).toLocaleString()}
 </td>
 <td className="px-6 py-4 text-right">
 <Link
 to={orgSlug ? `/o/${orgSlug}/support/${ticket._id}` : `/support/${ticket._id}`}
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
 <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
 <h2 className="text-xl font-bold text-gray-900 mb-4">Create Support Ticket</h2>
 <form onSubmit={handleCreateTicket} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
          Details
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

 {/* Standard Issue Options - Checkboxes */}
 {standardQueries.length > 0 && (
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Select your issue(s)
 </label>
 <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
 {standardQueries.map((query) => (
 <label key={query._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
 <input
 type="checkbox"
 checked={createForm.selectedIssues.includes(query.label)}
 onChange={() => handleIssueToggle(query.label)}
 className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
 />
 <span className="text-sm text-gray-700">{query.label}</span>
 </label>
 ))}
 </div>
 </div>
 )}

 {/* Describe Field - Shown when "Others" is selected */}
 {showDescribeField && (
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Describe your issue
 </label>
 <textarea
 rows={4}
 value={createForm.message}
 onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Describe your issue in detail..."
 />
 </div>
 )}

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
 <option value="medium">Medium</option>
 <option value="high">High</option>
 <option value="urgent">Urgent</option>
 </select>
 </div>
 </div>

 {/* Hidden message field for non-Others selections (fallback) */}
 {!showDescribeField && (
 <input type="hidden" value={createForm.selectedIssues.join('; ')} name="message" />
 )}

 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={() => {
 setShowCreateModal(false);
 setCreateForm({
 subject: '',
 message: '',
 category: 'general',
 priority: 'medium',
 selectedIssues: [],
 });
 setShowDescribeField(false);
 }}
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
