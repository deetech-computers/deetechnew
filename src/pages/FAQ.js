import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Phone, 
  ShoppingBag, 
  FileText,
  CreditCard,
  Truck,
  Shield,
  User,
  Users,
  HeadphonesIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FAQSearch from '../components/FAQSearch';
import '../styles/faq.css';

const FAQ = () => {
  const [active, setActive] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleFAQ = (index) => setActive(active === index ? null : index);

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/account?tab=orders');
    } else {
      navigate('/login');
    }
  };

  const categories = {
    all: { name: 'All Questions', icon: HelpCircle },
    ordering: { name: 'Ordering', icon: ShoppingBag },
    payment: { name: 'Payment', icon: CreditCard },
    delivery: { name: 'Delivery', icon: Truck },
    warranty: { name: 'Warranty & Returns', icon: Shield },
    account: { name: 'Account', icon: User },
    affiliates: { name: 'Affiliates', icon: Users },
    support: { name: 'Support', icon: HeadphonesIcon }
  };

  const faqs = [
    // === ORDERING ===
    {
      question: 'How do I place an order?',
      answer: 'You can place an order directly on our website by selecting your desired product, clicking "Add to Cart," and completing the checkout form with your details. Alternatively, you can contact us on WhatsApp for direct assistance with your purchase.',
      category: 'ordering'
    },
    {
      question: 'Can I order without creating an account?',
      answer: 'Yes. You can check out as a guest, but we recommend creating an account so you can track orders, view order history, and enjoy faster checkout next time.',
      category: 'ordering'
    },
    {
      question: 'How do I know my order was successful?',
      answer: 'After placing your order, you will receive a confirmation message or email from DEETECH COMPUTERS. Our team will also contact you to verify your order before delivery.',
      category: 'ordering'
    },

    // === PAYMENT ===
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Mobile Money (MTN, Telecel), Hubtel payments, and bank transfers. We also accept in-person payment at our Kumasi office for verified customers.',
      category: 'payment'
    },
    {
      question: 'Is payment required before delivery?',
      answer: 'Yes. Full payment is required before delivery for online orders. This ensures safe, verified transactions for both parties. For bulk or verified repeat customers, partial payment options may be available.',
      category: 'payment'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Absolutely. All payments are processed through trusted and encrypted channels such as Hubtel and official mobile money APIs. DEETECH COMPUTERS never stores or shares your financial information.',
      category: 'payment'
    },

    // === DELIVERY ===
    {
      question: 'Do you offer nationwide delivery?',
      answer: 'Yes. We deliver to all 16 regions of Ghana through trusted logistics partners. Delivery time is typically 8-24 hours depending on your location.',
      category: 'delivery'
    },
    {
      question: 'How much does delivery cost?',
      answer: 'Delivery is free for most orders across Ghana. In rare cases (remote areas or special product types), a small delivery fee may apply. You\'ll always be informed before payment.',
      category: 'delivery'
    },
    {
      question: 'Can I track my delivery?',
      answer: 'Yes. Once your order is shipped, you will receive a tracking update or a call from our delivery agent with estimated delivery time.',
      category: 'delivery'
    },

    // === WARRANTY & RETURNS ===
    {
      question: 'Do you provide warranty on products?',
      answer: 'Yes. All laptops and electronics come with a warranty ranging from 1 to 2 months, depending on the brand and product type. Warranty covers manufacturing defects only.',
      category: 'warranty'
    },
    {
      question: 'Can I return or exchange a product?',
      answer: 'Yes. You can return or exchange a product within 7 days if it is defective or not as described. Products must be in their original packaging and condition.',
      category: 'warranty'
    },
    {
      question: 'What items are not eligible for return?',
      answer: 'Items damaged by the customer, software issues, and accessories (e.g. chargers, cables) without manufacturing faults are not eligible for return.',
      category: 'warranty'
    },

    // === ACCOUNT ===
    {
      question: 'Why should I create a DEETECH account?',
      answer: 'An account helps you manage your orders, track delivery, save favorite products, and join our affiliate program easily. It also provides faster checkout on future purchases.',
      category: 'account'
    },
    {
      question: 'I forgot my password. What should I do?',
      answer: 'Click on "Forgot Password" on the login page and follow the reset instructions sent to your registered email address.',
      category: 'account'
    },

    // === AFFILIATES ===
    {
      question: 'How does the DEETECH Affiliate Program work?',
      answer: 'Our Affiliate Program allows you to earn 5% commission for every product sold through your referral link. Sign up through the "Affiliates" page to get started.',
      category: 'affiliates'
    },
    {
      question: 'When and how do affiliates get paid?',
      answer: 'Affiliate commissions are processed through Mobile Money or bank transfer once sales are confirmed and cleared.',
      category: 'affiliates'
    },

    // === SUPPORT ===
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our support team via email at deetechcomputers01@gmail.com, on WhatsApp at +233 591755964, or by calling +233 509673406.',
      category: 'support'
    },
    {
      question: 'What are your working hours?',
      answer: 'Our support and delivery team are available Monday–Saturday, 8:00 AM – 7:00 PM. Sunday responses may be delayed.',
      category: 'support'
    },
    {
      question: 'Where is DEETECH COMPUTERS located?',
      answer: 'Our main office is located in Kumasi, serving the entire Ashanti Region and customers across Ghana through our nationwide delivery network.',
      category: 'support'
    },
  ];

  // Filter FAQs based on search term and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const noResults = filteredFaqs.length === 0 && searchTerm !== '';

  return (
    <div className="container faq-container">
      {/* Hero Section with Search */}
      <div className="faq-hero">
        <div className="hero-content">
          <HelpCircle size={48} className="hero-icon" />
          <h1>FAQ & Help Center</h1>
          <p>Find detailed answers to all your questions about orders, payments, delivery, warranty, and more.</p>
          
          {/* UPDATED: Using FAQSearch component */}
          <FAQSearch 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search for answers..."
          />
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions">
        <div className="action-card">
          <ShoppingBag size={24} />
          <h4>Track Your Order</h4>
          <p>Check your order status and delivery updates</p>
          <button onClick={handleTrackOrder} className="action-link">
            Track Now
          </button>
        </div>
        
        <div className="action-card">
          <MessageCircle size={24} />
          <h4>Live Support</h4>
          <p>Get instant help from our support team</p>
          <a href="https://wa.me/233591755964" className="action-link">Chat Now</a>
        </div>
        
        <div className="action-card">
          <FileText size={24} />
          <h4>Policies</h4>
          <p>Read our warranty and return policies</p>
          <Link to="/warranty" className="action-link">View Policies</Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="faq-categories">
        {Object.entries(categories).map(([key, { name, icon: Icon }]) => (
          <button
            key={key}
            className={`category-tab ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="faq-list">
        {noResults ? (
          <div className="no-results">
            <HelpCircle size={48} />
            <h3>No results found</h3>
            <p>We couldn't find any FAQs matching "{searchTerm}". Try different keywords or browse by category.</p>
          </div>
        ) : (
          <>
            <div className="results-count">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'} found
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            
            {filteredFaqs.map((item, index) => (
              <div className={`faq-item ${active === index ? 'active' : ''}`} key={index}>
                <div className="faq-question" onClick={() => toggleFAQ(index)}>
                  <div className="question-content">
                    <h3>{item.question}</h3>
                    <span className="category-badge">{categories[item.category].name}</span>
                  </div>
                  {active === index ? <Minus size={20} /> : <Plus size={20} />}
                </div>
                {active === index && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Enhanced Contact Section */}
     {/* Enhanced Contact Section */}
<div className="faq-contact">
  <div className="faq-contact-header">
    <h2>Still Need Help?</h2>
    <p>Our dedicated support team is here to assist you with any questions or concerns.</p>
  </div>
  
  <div className="faq-contact-grid">
    <div className="faq-contact-method">
      <div className="faq-contact-icon faq-contact-icon-email">
        <Mail size={24} />
      </div>
      <h4>Email Support</h4>
      <p>Get detailed responses within hours</p>
      <a href="mailto:deetechcomputers01@gmail.com" className="faq-contact-link">
        deetechcomputers01@gmail.com
      </a>
    </div>
    
    <div className="faq-contact-method">
      <div className="faq-contact-icon faq-contact-icon-whatsapp">
        <MessageCircle size={24} />
      </div>
      <h4>WhatsApp Chat</h4>
      <p>Instant support during business hours</p>
      <a href="https://wa.me/233591755964" target="_blank" rel="noreferrer" className="faq-contact-link">
        +233 591 755 964
      </a>
    </div>
    
    <div className="faq-contact-method">
      <div className="faq-contact-icon faq-contact-icon-phone">
        <Phone size={24} />
      </div>
      <h4>Phone Call</h4>
      <p>Speak directly with our team</p>
      <a href="tel:+233591755964" className="faq-contact-link">
        +233 591 755 964
      </a>
    </div>
  </div>

  <div className="faq-business-info">
    <div className="faq-info-item">
      <strong>Business Hours:</strong> Mon-Sat: 8:00 AM - 7:00 PM
    </div>
    <div className="faq-info-item">
      <strong>Location:</strong> Kumasi, Ghana
    </div>
    <div className="faq-info-item">
      <strong>Response Time:</strong> Typically within 1-2 hours during business hours
    </div>
  </div>
</div>
    </div>
  );
};

export default FAQ;