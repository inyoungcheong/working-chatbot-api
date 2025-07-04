# Jekyll Integration Guide

This guide will help you integrate the empathetic chatbot into your Jekyll website.

## Quick Start

The easiest way to add this chatbot to your Jekyll site is with a floating widget. Here's how:

### 1. Add the Widget Script to Your Site

Add this to your Jekyll site's `_layouts/default.html` before the closing `</body>` tag:

```html
<!-- Empathetic Chatbot Widget -->
<script>
(function() {
  // Replace with your actual Replit app URL
  const API_BASE = 'https://your-chatbot-domain.replit.app';
  
  // Create floating chat button
  const chatButton = document.createElement('div');
  chatButton.innerHTML = '💬';
  chatButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 24px;
    z-index: 1000;
    transition: transform 0.3s ease;
  `;
  
  chatButton.addEventListener('mouseenter', () => {
    chatButton.style.transform = 'scale(1.1)';
  });
  
  chatButton.addEventListener('mouseleave', () => {
    chatButton.style.transform = 'scale(1)';
  });
  
  // Create chat iframe
  const chatFrame = document.createElement('iframe');
  chatFrame.src = API_BASE + '/chat';
  chatFrame.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    display: none;
    z-index: 999;
    background: white;
  `;
  
  let isOpen = false;
  
  chatButton.addEventListener('click', () => {
    isOpen = !isOpen;
    chatFrame.style.display = isOpen ? 'block' : 'none';
    chatButton.innerHTML = isOpen ? '✕' : '💬';
  });
  
  // Add to page when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(chatButton);
      document.body.appendChild(chatFrame);
    });
  } else {
    document.body.appendChild(chatButton);
    document.body.appendChild(chatFrame);
  }
})();
</script>
```

### 2. Update the API URL

Replace `your-chatbot-domain.replit.app` with your actual Replit deployment URL.

### 3. Customize Appearance (Optional)

You can customize the widget by modifying the CSS styles in the script above.

## Alternative Integration Options

### Option A: Dedicated Chat Page

Create a new file `chat.html` in your Jekyll site:

```html
---
layout: default
title: "Daily Planning Assistant"
permalink: /chat/
---

<div style="height: 100vh; max-height: 800px;">
  <iframe 
    src="https://your-chatbot-domain.replit.app/chat" 
    width="100%" 
    height="100%" 
    frameborder="0"
    style="border-radius: 8px;">
  </iframe>
</div>
```

### Option B: Blog Post Integration

Add this to any blog post or page:

```html
<div class="chatbot-embed" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 2rem 0;">
  <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 1rem; font-weight: bold;">
    💭 Need help planning your day? Chat with our AI assistant
  </div>
  <iframe 
    src="https://your-chatbot-domain.replit.app/chat" 
    width="100%" 
    height="500px" 
    frameborder="0">
  </iframe>
</div>
```

## Mobile Responsive Considerations

The floating widget automatically adjusts for mobile devices. For dedicated pages, consider adding this CSS:

```css
@media (max-width: 768px) {
  .chatbot-embed iframe {
    height: 400px;
  }
}
```

## Next Steps

1. Deploy your chatbot to Replit
2. Copy your Replit app URL
3. Add the widget script to your Jekyll site
4. Test on your staging site before going live

The chatbot will work immediately and provide your visitors with empathetic daily planning support!