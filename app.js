class JiraTicketGenerator {
    constructor() {
        this.form = document.getElementById('ticketForm');
        this.livePreview = document.getElementById('livePreview');
        this.generatedOutput = document.getElementById('generatedOutput');
        this.stepCounter = 1;
        this.attachmentCounter = 0;
        
        this.jiraTemplate = {
            hubspot_panel: "{panel:bgColor=#deebff}\nh4. HubSpot linked tickets:\n* [{{title}} (Ticket ID: {{id}})]({{url}})\n_(please, do not edit or duplicate in description)_\n{panel}",
            client_info: "Client Name: {{client_name}}\nClient ID: {{client_id}}\nStore Name: {{store_name}}\nStore ID: {{store_id}}",
            steps_format: "Steps to replicate:\n{{steps}}",
            behavior_format: "*Current Behaviour:*\n{{current_behavior}}\n\n*Expected Behaviour:*\n{{expected_behavior}}",
            attachment_format: "!{{filename}}|width={{width}},height={{height}},alt=\"{{filename}}\"!"
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateRemoveButtons();
    }
    
    setupEventListeners() {
        // HubSpot checkbox toggle
        const hubspotCheckbox = document.getElementById('linkHubSpot');
        const hubspotFields = document.getElementById('hubspotFields');
        
        hubspotCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                hubspotFields.classList.remove('hidden');
            } else {
                hubspotFields.classList.add('hidden');
                // Clear HubSpot fields when hidden
                hubspotFields.querySelectorAll('input').forEach(input => input.value = '');
            }
            this.updatePreview();
        });
        
        // Add step functionality
        document.getElementById('addStep').addEventListener('click', () => {
            this.addStep();
        });
        
        // Add attachment functionality
        document.getElementById('addAttachment').addEventListener('click', () => {
            this.addAttachment();
        });
        
        // Copy to clipboard
        document.getElementById('copyToClipboard').addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        // Download functionality
        document.getElementById('downloadDescription').addEventListener('click', () => {
            this.downloadDescription();
        });
        
        // Reset form
        document.getElementById('resetForm').addEventListener('click', () => {
            this.resetForm();
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateDescription();
        });
        
        // Real-time preview updates
        this.form.addEventListener('input', () => {
            this.updatePreview();
        });
        
        this.form.addEventListener('change', () => {
            this.updatePreview();
        });
        
        // Initial step remove button setup
        this.setupStepRemoveListeners();
    }
    
    addStep() {
        this.stepCounter++;
        const stepsContainer = document.getElementById('stepsContainer');
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.innerHTML = `
            <input type="text" name="step" class="form-control step-input" placeholder="Enter step..." required>
            <button type="button" class="btn btn--secondary btn--sm remove-step">Remove</button>
        `;
        
        stepsContainer.appendChild(stepItem);
        this.setupStepRemoveListeners();
        this.updateRemoveButtons();
        
        // Focus on the new input
        stepItem.querySelector('input').focus();
    }
    
    addAttachment() {
        this.attachmentCounter++;
        const attachmentsContainer = document.getElementById('attachmentsContainer');
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        attachmentItem.innerHTML = `
            <div>
                <label>Filename:</label>
                <input type="text" name="attachmentFilename" class="form-control" placeholder="screenshot.png">
            </div>
            <div>
                <label>Width:</label>
                <input type="number" name="attachmentWidth" class="form-control" placeholder="800">
            </div>
            <div>
                <label>Height:</label>
                <input type="number" name="attachmentHeight" class="form-control" placeholder="600">
            </div>
            <button type="button" class="btn btn--secondary btn--sm remove-attachment">Remove</button>
        `;
        
        attachmentsContainer.appendChild(attachmentItem);
        this.setupAttachmentRemoveListeners();
        
        // Focus on the filename input
        attachmentItem.querySelector('input[name="attachmentFilename"]').focus();
    }
    
    setupStepRemoveListeners() {
        document.querySelectorAll('.remove-step').forEach(button => {
            button.removeEventListener('click', this.removeStepHandler);
            button.addEventListener('click', this.removeStepHandler.bind(this));
        });
    }
    
    setupAttachmentRemoveListeners() {
        document.querySelectorAll('.remove-attachment').forEach(button => {
            button.removeEventListener('click', this.removeAttachmentHandler);
            button.addEventListener('click', this.removeAttachmentHandler.bind(this));
        });
    }
    
    removeStepHandler(e) {
        e.target.closest('.step-item').remove();
        this.updateRemoveButtons();
        this.updatePreview();
    }
    
    removeAttachmentHandler(e) {
        e.target.closest('.attachment-item').remove();
        this.updatePreview();
    }
    
    updateRemoveButtons() {
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach((item, index) => {
            const removeButton = item.querySelector('.remove-step');
            removeButton.disabled = stepItems.length <= 1;
        });
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Get basic form data
        for (let [key, value] of formData.entries()) {
            if (key === 'step') {
                if (!data.steps) data.steps = [];
                if (value.trim()) data.steps.push(value.trim());
            } else if (key === 'attachmentFilename') {
                if (!data.attachments) data.attachments = [];
                data.attachments.push({ filename: value });
            } else if (key === 'attachmentWidth') {
                if (data.attachments && data.attachments.length > 0) {
                    const lastAttachment = data.attachments[data.attachments.length - 1];
                    if (!lastAttachment.width) {
                        lastAttachment.width = value || '800';
                    }
                }
            } else if (key === 'attachmentHeight') {
                if (data.attachments && data.attachments.length > 0) {
                    const lastAttachment = data.attachments[data.attachments.length - 1];
                    if (!lastAttachment.height) {
                        lastAttachment.height = value || '600';
                    }
                }
            } else {
                data[key] = value;
            }
        }
        
        // Get attachment data properly
        const attachmentItems = document.querySelectorAll('.attachment-item');
        data.attachments = [];
        attachmentItems.forEach(item => {
            const filename = item.querySelector('input[name="attachmentFilename"]').value;
            const width = item.querySelector('input[name="attachmentWidth"]').value || '800';
            const height = item.querySelector('input[name="attachmentHeight"]').value || '600';
            
            if (filename.trim()) {
                data.attachments.push({ filename: filename.trim(), width, height });
            }
        });
        
        return data;
    }
    
    generateJiraDescription(data) {
        let description = '';
        
        // HubSpot Panel (if applicable)
        if (data.linkHubSpot && data.ticketTitle && data.ticketId && data.hubspotUrl) {
            description += this.jiraTemplate.hubspot_panel
                .replace('{{title}}', data.ticketTitle)
                .replace('{{id}}', data.ticketId)
                .replace('{{url}}', data.hubspotUrl) + '\n\n';
        }
        
        // Client Information
        if (data.clientName || data.clientId || data.storeName || data.storeId) {
            description += this.jiraTemplate.client_info
                .replace('{{client_name}}', data.clientName || '')
                .replace('{{client_id}}', data.clientId || '')
                .replace('{{store_name}}', data.storeName || '')
                .replace('{{store_id}}', data.storeId || '') + '\n\n';
        }
        
        // Receipt Number
        if (data.receiptNumber && data.receiptNumber.trim()) {
            description += `Receipt Number: ${data.receiptNumber}\n\n`;
        }
        
        // Background Information
        if (data.backgroundInfo && data.backgroundInfo.trim()) {
            description += `*Background Information:*\n${data.backgroundInfo}\n\n`;
        }
        
        // Steps to replicate
        if (data.steps && data.steps.length > 0) {
            let stepsText = 'Steps to replicate:\n';
            data.steps.forEach((step, index) => {
                stepsText += `# ${step}\n`;
            });
            description += stepsText + '\n';
        }
        
        // Current and Expected Behavior
        if (data.currentBehavior || data.expectedBehavior) {
            description += this.jiraTemplate.behavior_format
                .replace('{{current_behavior}}', data.currentBehavior || '')
                .replace('{{expected_behavior}}', data.expectedBehavior || '') + '\n\n';
        }
        
        // Attachments
        if (data.attachments && data.attachments.length > 0) {
            description += '*Attachments:*\n';
            data.attachments.forEach(attachment => {
                description += this.jiraTemplate.attachment_format
                    .replace(/{{filename}}/g, attachment.filename)
                    .replace('{{width}}', attachment.width)
                    .replace('{{height}}', attachment.height) + '\n';
            });
            description += '\n';
        }
        
        // Additional Notes
        if (data.additionalNotes && data.additionalNotes.trim()) {
            description += `*Additional Notes:*\n${data.additionalNotes}\n`;
        }
        
        return description.trim();
    }
    
    generatePreviewHTML(data) {
        let preview = '';
        
        // HubSpot Panel (if applicable)
        if (data.linkHubSpot && data.ticketTitle && data.ticketId && data.hubspotUrl) {
            preview += `<div class="jira-panel">
                <h4>HubSpot linked tickets:</h4>
                <ul><li><a href="${data.hubspotUrl}" target="_blank">${data.ticketTitle} (Ticket ID: ${data.ticketId})</a></li></ul>
                <em>(please, do not edit or duplicate in description)</em>
            </div>\n\n`;
        }
        
        // Client Information
        if (data.clientName || data.clientId || data.storeName || data.storeId) {
            preview += `<strong>Client Name:</strong> ${data.clientName || ''}<br>
            <strong>Client ID:</strong> ${data.clientId || ''}<br>
            <strong>Store Name:</strong> ${data.storeName || ''}<br>
            <strong>Store ID:</strong> ${data.storeId || ''}<br><br>`;
        }
        
        // Receipt Number
        if (data.receiptNumber && data.receiptNumber.trim()) {
            preview += `<strong>Receipt Number:</strong> ${data.receiptNumber}<br><br>`;
        }
        
        // Background Information
        if (data.backgroundInfo && data.backgroundInfo.trim()) {
            preview += `<strong>Background Information:</strong><br>${data.backgroundInfo.replace(/\n/g, '<br>')}<br><br>`;
        }
        
        // Steps to replicate
        if (data.steps && data.steps.length > 0) {
            preview += '<strong>Steps to replicate:</strong><br><ol>';
            data.steps.forEach(step => {
                preview += `<li>${step}</li>`;
            });
            preview += '</ol><br>';
        }
        
        // Current and Expected Behavior
        if (data.currentBehavior || data.expectedBehavior) {
            preview += `<strong>Current Behaviour:</strong><br>${(data.currentBehavior || '').replace(/\n/g, '<br>')}<br><br>
            <strong>Expected Behaviour:</strong><br>${(data.expectedBehavior || '').replace(/\n/g, '<br>')}<br><br>`;
        }
        
        // Attachments
        if (data.attachments && data.attachments.length > 0) {
            preview += '<strong>Attachments:</strong><br>';
            data.attachments.forEach(attachment => {
                preview += `📎 ${attachment.filename} (${attachment.width}x${attachment.height})<br>`;
            });
            preview += '<br>';
        }
        
        // Additional Notes
        if (data.additionalNotes && data.additionalNotes.trim()) {
            preview += `<strong>Additional Notes:</strong><br>${data.additionalNotes.replace(/\n/g, '<br>')}<br>`;
        }
        
        return preview || '<p class="preview-placeholder">Fill out the form to see a live preview of your Jira description...</p>';
    }
    
    updatePreview() {
        const data = this.getFormData();
        const previewHTML = this.generatePreviewHTML(data);
        this.livePreview.innerHTML = previewHTML;
    }
    
    generateDescription() {
        const data = this.getFormData();
        
        // Validate required fields
        if (!this.validateForm(data)) {
            return;
        }
        
        const description = this.generateJiraDescription(data);
        this.generatedOutput.value = description;
        
        // Enable action buttons
        document.getElementById('copyToClipboard').disabled = false;
        document.getElementById('downloadDescription').disabled = false;
        
        // Show success message
        this.showStatusMessage('Description generated successfully!', 'success');
    }
    
    validateForm(data) {
        let isValid = true;
        
        // Remove previous error states
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        
        // Check required fields
        if (!data.issueType) {
            this.markFieldError('issueType');
            isValid = false;
        }
        
        if (!data.clientName || !data.clientId || !data.storeName || !data.storeId) {
            ['clientName', 'clientId', 'storeName', 'storeId'].forEach(field => {
                if (!data[field]) this.markFieldError(field);
            });
            isValid = false;
        }
        
        if (!data.steps || data.steps.length === 0) {
            this.showStatusMessage('Please add at least one step to replicate the issue.', 'error');
            isValid = false;
        }
        
        if (!data.currentBehavior || !data.expectedBehavior) {
            ['currentBehavior', 'expectedBehavior'].forEach(field => {
                if (!data[field]) this.markFieldError(field);
            });
            isValid = false;
        }
        
        if (!isValid) {
            this.showStatusMessage('Please fill in all required fields.', 'error');
        }
        
        return isValid;
    }
    
    markFieldError(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.closest('.form-group').classList.add('error');
        }
    }
    
    showStatusMessage(message, type) {
        // Remove existing status messages
        document.querySelectorAll('.status-message').forEach(msg => msg.remove());
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-message--${type}`;
        statusDiv.textContent = message;
        
        // Insert after form actions
        const formActions = document.querySelector('.form-actions');
        formActions.parentNode.insertBefore(statusDiv, formActions.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusDiv.remove();
        }, 5000);
    }
    
    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.generatedOutput.value);
            this.showStatusMessage('Description copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            this.generatedOutput.select();
            document.execCommand('copy');
            this.showStatusMessage('Description copied to clipboard!', 'success');
        }
    }
    
    downloadDescription() {
        const content = this.generatedOutput.value;
        const data = this.getFormData();
        const filename = `jira-ticket-${data.issueType || 'ticket'}-${Date.now()}.txt`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatusMessage('Description downloaded successfully!', 'success');
    }
    
    resetForm() {
        if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
            this.form.reset();
            
            // Reset dynamic elements
            const stepsContainer = document.getElementById('stepsContainer');
            stepsContainer.innerHTML = `
                <div class="step-item">
                    <input type="text" name="step" class="form-control step-input" placeholder="Enter step..." required>
                    <button type="button" class="btn btn--secondary btn--sm remove-step" disabled>Remove</button>
                </div>
            `;
            
            document.getElementById('attachmentsContainer').innerHTML = '';
            document.getElementById('hubspotFields').classList.add('hidden');
            
            // Reset outputs
            this.generatedOutput.value = '';
            this.livePreview.innerHTML = '<p class="preview-placeholder">Fill out the form to see a live preview of your Jira description...</p>';
            
            // Disable action buttons
            document.getElementById('copyToClipboard').disabled = true;
            document.getElementById('downloadDescription').disabled = true;
            
            // Remove error states
            document.querySelectorAll('.form-group.error').forEach(group => {
                group.classList.remove('error');
            });
            
            // Reset counters
            this.stepCounter = 1;
            this.attachmentCounter = 0;
            
            // Re-setup listeners
            this.setupStepRemoveListeners();
            this.updateRemoveButtons();
            
            this.showStatusMessage('Form reset successfully!', 'success');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JiraTicketGenerator();
});