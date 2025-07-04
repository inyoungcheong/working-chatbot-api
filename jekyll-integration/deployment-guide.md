# Deployment Guide for Jekyll Integration

## Step 1: Deploy Your Chatbot to Replit

1. **Get your Replit URL**: After deploying, your chatbot will be available at:
   `https://your-repl-name--your-username.replit.app`

2. **Test the deployment**: Visit the URL and ensure the chat interface works properly.

## Step 2: Choose Your Jekyll Integration Method

### Method A: Floating Widget (Easiest)
Perfect for adding chat support across your entire site.

1. Copy the code from `floating-widget.html`
2. Paste it into your `_layouts/default.html` before `</body>`
3. Replace `your-replit-app.replit.app` with your actual URL
4. The widget appears on all pages automatically

### Method B: Dedicated Page
Creates a standalone planning assistant page.

1. Copy `dedicated-page.html` to your Jekyll site
2. Save it as `planning-assistant.html` in your root directory
3. Update the Replit URL in the iframe
4. Add a link to `/planning-assistant/` in your navigation

### Method C: Blog Post Embeds
Add the chatbot to specific blog posts about productivity.

1. Save `blog-post-embed.html` as `_includes/chatbot-embed.html`
2. In any blog post, add: `{% include chatbot-embed.html %}`
3. Update the Replit URL in the include file

## Step 3: Update Your Jekyll Configuration

Add this to your `_config.yml` (optional):

```yaml
# Chatbot configuration
chatbot:
  enabled: true
  replit_url: "https://your-repl-name--your-username.replit.app"
  
# If using dedicated page, add to navigation
header_pages:
  - planning-assistant.html
```

## Step 4: Customize for Your Site

### Theme Integration
Match your Jekyll theme colors by updating the CSS variables:

```css
:root {
  --chatbot-primary: #your-theme-color;
  --chatbot-secondary: #your-secondary-color;
  --chatbot-text: #your-text-color;
}
```

### Content Customization
Update the text in the integration files to match your site's voice:
- Widget button tooltip
- Page headers and descriptions  
- Feature descriptions
- Call-to-action text

## Step 5: Test Your Integration

1. **Local testing**: Run `bundle exec jekyll serve` and test the widget
2. **Mobile testing**: Check responsive behavior on different screen sizes
3. **Cross-browser testing**: Verify iframe loading in different browsers
4. **Performance testing**: Ensure the widget doesn't slow down your site

## Step 6: Go Live

1. Deploy your Jekyll site with the new integration
2. Test the live version thoroughly
3. Monitor for any issues or user feedback

## Troubleshooting

### Widget not appearing
- Check browser console for JavaScript errors
- Verify the Replit URL is correct and accessible
- Ensure the script is loading after the DOM

### Iframe not loading
- Check if your Replit app is deployed and running
- Verify CORS settings allow embedding
- Test the direct URL to your chat interface

### Mobile layout issues
- The floating widget automatically adjusts for mobile
- For dedicated pages, test iframe height on various devices
- Consider reducing iframe height on smaller screens

## Security Notes

- The chatbot runs on Replit's secure infrastructure
- No sensitive data passes through your Jekyll site
- Consider adding Content Security Policy headers if needed

## Performance Optimization

- The iframe loads only when the widget is opened
- Consider lazy loading for blog post embeds
- Monitor Core Web Vitals impact

Your empathetic chatbot is now ready to help your Jekyll site visitors with daily planning and creative block support!