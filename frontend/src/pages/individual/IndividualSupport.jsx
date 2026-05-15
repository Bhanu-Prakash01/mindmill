import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { supportService } from '../../services';
import { HelpCircle, Mail, MessageSquare, Send, CheckCircle, Loader2, Clock, ArrowRight } from 'lucide-react';

const IndividualSupport = () => {
  const toast = useToast();
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general', priority: 'medium' });
  const [sending, setSending] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    supportService.getComplaintTypes()
      .then(r => setComplaintTypes(r.data?.types || []))
      .catch(() => {});
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await supportService.getMyTickets();
      setTickets(res.data?.tickets || []);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await supportService.createTicket({
        subject: form.subject,
        message: form.message,
        category: form.category,
        priority: form.priority,
      });
      toast.success('Ticket submitted successfully!');
      setForm({ subject: '', message: '', category: 'general', priority: 'medium' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      answered: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-500 mt-1">We're here to help. Send us a message and we'll get back to you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Email Us</p>
            <a href="mailto:support@mindmill.in" className="text-xs text-indigo-600 hover:underline">support@mindmill.in</a>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">FAQ</p>
            <p className="text-xs text-gray-500">Check common questions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          Submit a Ticket
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              required value={form.subject} onChange={set('subject')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              placeholder="What do you need help with?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                value={form.category} onChange={set('category')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              >
                {complaintTypes.map((t) => (
                  <option key={t._id} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={form.priority} onChange={set('priority')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              required rows={5} value={form.message} onChange={set('message')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit" disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>

      {/* My Tickets */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Tickets</h2>
        </div>

        {loadingTickets ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-10">
            <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No tickets yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="capitalize">{ticket.category?.replace(/_/g, ' ')}</span>
                      <span className="text-gray-300">·</span>
                      <Clock className="w-3 h-3 inline" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    {ticket.message && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {statusBadge(ticket.status)}
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualSupport;
