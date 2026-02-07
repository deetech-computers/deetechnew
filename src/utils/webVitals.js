// utils/webVitals.js
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

const trackWebVitals = () => {
  if (process.env.NODE_ENV === 'production') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Track Core Web Vitals
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getLCP(sendToAnalytics);
      
      // Track additional metrics
      getFCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }
};

function sendToAnalytics(metric) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', 'web_vital', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Send to your analytics service
  console.log('Web Vital:', metric);
}

export { reportWebVitals, trackWebVitals };