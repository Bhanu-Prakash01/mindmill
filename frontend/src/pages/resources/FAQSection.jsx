import { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'How does the credit system work?',
    answer: 'Each assessment of any type requires credits to launch and complete the test. Admins can purchase credits based on their assessment usage requirements. Mention in the credit request how many tests or what type you wish to buy. The credit consumption chart is on the platform; you need to use your credit balance accordingly.'
  },
  {
    id: 2,
    question: 'Is any assessment available for free?',
    answer: 'Yes. Every new user can access one complimentary assessment/test as part of the platform trial experience. You can view the report or see the functionality of the platform.'
  },
  {
    id: 3,
    question: 'When is a credit deducted?',
    answer: 'A credit is automatically consumed once the "Start Test" button is clicked by the test taker. Even if the test is left halfway, the credit will be used. When you distribute the test link, your credit will be blocked. Only after the expiry of the tests, if any test link remains unused, will that be credited back to your credit balance.'
  },
  {
    id: 4,
    question: 'What happens if the candidate leaves the test midway?',
    answer: 'If a test is abandoned, interrupted, or left incomplete after starting, the credit will still be treated as consumed. A fresh test link and a new credit will be required to reattempt the assessment.'
  },
  {
    id: 5,
    question: 'Does the assessment link expire?',
    answer: 'Yes. Every assessment link is time-bound and remains active only for a specified validity period configured by the platform or administrator.'
  },
  {
    id: 6,
    question: 'Can the same assessment link be reused?',
    answer: 'No. Assessment links are designed for one-time usage only and cannot be reused once initiated or expired.'
  },
  {
    id: 7,
    question: 'What happens if the assessment link expires before use?',
    answer: 'An expired link becomes inactive automatically. A new assessment link may need to be generated using an additional credit; the credit that is blocked against the expired assessment will be automatically credited back on expiry.'
  },
  {
    id: 8,
    question: 'Are purchased credits refundable?',
    answer: 'No. All credit purchases made on the platform are final and non-refundable.'
  },
  {
    id: 9,
    question: 'How can users raise technical issues or complaints?',
    answer: 'Users can raise concerns, complaints, suggestions or technical support requests directly through the platform\'s support/helpdesk system. Our customer support team typically responds within 24 working hours or earlier, depending on the nature and urgency of the request. You may check the status on your dashboard.'
  },
  {
    id: 10,
    question: 'Is user data secure on the platform?',
    answer: 'Yes. The platform follows enterprise-grade security protocols, encrypted data practices, and secure cloud infrastructure to safeguard user information and assessment data.'
  },
  {
    id: 11,
    question: 'Can assessments be paused and resumed later?',
    answer: 'Assessment continuity depends on the configuration of the specific test. Certain assessments may not allow pause-and-resume functionality once initiated.'
  },
  {
    id: 12,
    question: 'Who can I contact for enterprise support or bulk assessment usage?',
    answer: 'Organisations requiring large-scale assessments, enterprise plans, or dedicated support can contact the platform\'s business support team through the official contact section or visit our website www.mindmil.com.'
  },
  {
    id: 13,
    question: 'How do I know which assessment to use?',
    answer: 'Every assessment has a purpose. You may watch the video in the resources to understand it more or read the attached PDF. The platform provides multiple test types that are used for recruitment, student learning ability, coachability or job seekers\' personality assessment.'
  }
];

const FAQSection = () => {
  const [openId, setOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="text-gray-500 mt-1">Find answers to common questions about the platform</p>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {/* FAQ Accordion */}
      {filteredFaqs.length > 0 ? (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`bg-white rounded-xl border transition-all duration-200 ${
                openId === faq.id
                  ? 'border-indigo-200 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-start gap-4 px-6 py-4 text-left"
                aria-expanded={openId === faq.id}
              >
                <HelpCircle
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors duration-200 ${
                    openId === faq.id ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`flex-1 text-sm font-medium leading-relaxed transition-colors duration-200 ${
                    openId === faq.id ? 'text-indigo-900' : 'text-gray-900'
                  }`}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-all duration-200 ${
                    openId === faq.id
                      ? 'rotate-180 text-indigo-600'
                      : 'text-gray-400'
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-4 pl-[3.75rem]">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <HelpCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchQuery
              ? `No FAQs match "${searchQuery}".`
              : 'No FAQs available.'}
          </p>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              Try a different search term.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FAQSection;
