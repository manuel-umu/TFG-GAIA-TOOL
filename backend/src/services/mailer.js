const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class EmailService {

    static async sendEmail(toEmail, subject, text, html) {
        const mailOptions = {
            from: `"Gaia Tool" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            text: text,
            html: html
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    static sendRecoveryCode(toEmail, code) {
        const subject = 'Password Recovery Code';
        const text = `
            Hello,

            Your password recovery code is: ${code}.

            Please open the application to recover your password.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>Your password recovery code is: <b>${code}</b>.</p>
            <p>Please open the application to recover your password.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

static sendAssignmentProcess(toEmail, processName, processDescription = '', processType) {
        const subject = `New Business Process`;
        const descriptionText = processDescription ? `<p><b>Description of the process:</b><br>${processDescription}.</p>` : '';
        const descriptionTextPlain = processDescription ? `Description of the process: ${processDescription}.` : '';

        const text = `
            Hello,

            You have been assigned as the responsible person for the business process: ${processName}.

            Type of process: ${processType}.

            ${descriptionTextPlain}

            Please open the application to view the indicators and other details of the process.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>You have been assigned as the <b>responsible person</b> for the business process: <b>${processName}</b>.</p>
            <p><b>Type of process:</b> ${processType}.</p>
            ${descriptionText}
            <p>Please open the application to view the <b>indicators</b> and other <b>details</b> of the process.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendDeassignmentProcess(toEmail, processID, processName, processType) {
        const subject = `Business Process Responsibility Changed`;
        const text = `
            Hello,

            You have been removed as the responsible person for the business process: ${processName} (P${processID}).

            Type of process: ${processType}.

            Please open the application to view the new responsible person for this business process.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>You have been removed as the responsible person for the business process: <b>${processName}</b> (P${processID}).</p>
            <p><b>Type of process:</b> ${processType}.</p>
            <p>Please open the application to view the new responsible person for this business process.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendProcessDeletion(toEmail, processID, processName, processType) {
        const subject = `Business Process Deleted`;
        const text = `
            Hello,

            The business process ${processName} (P${processID}) has been deleted.

            Type of process: ${processType}.

            If you believe this was a mistake, please contact the system administrator.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>The business process <b>${processName}</b> (P${processID}) has been <b>deleted</b>.</p>
            <p><b>Type of process:</b> ${processType}.</p>
            <p>If you believe this was a mistake, please contact the system administrator.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendEvaluatorAssignment(toEmail, auditName, auditDescription = '', auditInitDate, auditEndDate, auditManager) {
        const subject = `New Audit`;

        // Prepare the description and plain text for the email
        const descriptionText = auditDescription ? `<p><b>Description:</b><br>${auditDescription}.</p>` : '';
        const descriptionTextPlain = auditDescription ? `Description of the audit: ${auditDescription}.` : '';

        // Formatting the date
        const initDateFormatted = auditInitDate ? `Start Date: ${auditInitDate}` : '';
        const endDateFormatted = auditEndDate ? `End Date: ${auditEndDate}` : '';

        const text = `
            Hello,

            You have been assigned as the evaluator auditor for the audit: ${auditName}.
            
            ${initDateFormatted ? `Start Date: ${auditInitDate}` : ''}
            ${endDateFormatted ? `End Date: ${auditEndDate}` : ''}
            
            Assigned by: ${auditManager}.
            
            ${descriptionTextPlain}
            
            Please open the application to view the audit details and your assigned tasks.

            Best regards,
            The Gaia Tool Support Team.
        `;
        
        const html = `
            <p>Hello,</p>
            <p>You have been assigned as the <b>evaluator auditor</b> for the audit: <b>${auditName}</b>.</p>
            ${initDateFormatted ? `<p><b>Start Date:</b> ${auditInitDate}</p>` : ''}
            ${endDateFormatted ? `<p><b>End Date:</b> ${auditEndDate}</p>` : ''}
            <p><b>Assigned by:</b> ${auditManager}</p>
            ${descriptionText}
            <p>Please open the application to view the <b>audit details</b> and your assigned tasks.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;

        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendEvaluatorDeassignment(toEmail, auditID, auditName, auditInitDate, auditEndDate, auditManager) {
        const subject = `Audit Evaluator Changed`;

        // Preparing the text and HTML content
        const initDateFormatted = auditInitDate ? `Start Date: ${auditInitDate}` : '';
        const endDateFormatted = auditEndDate ? `End Date: ${auditEndDate}` : '';

        const text = `
            Hello,

            You have been removed as the evaluator auditor for the audit: ${auditName} (A${auditID}).
            
            ${initDateFormatted ? `Start Date: ${auditInitDate}` : ''}
            ${endDateFormatted ? `End Date: ${auditEndDate}` : ''}
            
            The new evaluator auditor has been assigned by: ${auditManager}.
            
            Please open the application to view the new evaluator auditor and other audit details.

            Best regards,
            The Gaia Tool Support Team.
        `;
        
        const html = `
            <p>Hello,</p>
            <p>You have been removed as the <b>evaluator auditor</b> for the audit: <b>${auditName}</b> (A${auditID}).</p>
            ${initDateFormatted ? `<p><b>Start Date:</b> ${auditInitDate}</p>` : ''}
            ${endDateFormatted ? `<p><b>End Date:</b> ${auditEndDate}</p>` : ''}
            <p>The new evaluator auditor has been assigned by: <b>${auditManager}</b>.</p>
            <p>Please open the application to view the <b>new evaluator auditor</b> and other <b>audit details</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;

        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendAuditDeletion(toEmail, auditID, auditName, auditInitDate, auditEndDate) {
        const subject = `Audit Deleted`;

        // Preparando el contenido del texto y el HTML
        const initDateFormatted = auditInitDate ? `Start Date: ${auditInitDate}` : '';
        const endDateFormatted = auditEndDate ? `End Date: ${auditEndDate}` : '';

        const text = `
            Hello,

            The audit ${auditName} (A${auditID}) has been deleted.
            
            ${initDateFormatted ? `Start Date: ${auditInitDate}` : ''}
            ${endDateFormatted ? `End Date: ${auditEndDate}` : ''}
            
            If you believe this was a mistake, please contact the system administrator.

            Best regards,
            The Gaia Tool Support Team.
        `;

        const html = `
            <p>Hello,</p>
            <p>The audit <b>${auditName}</b> (A${auditID}) has been <b>deleted</b>.</p>
            ${initDateFormatted ? `<p><b>Start Date:</b> ${auditInitDate}</p>` : ''}
            ${endDateFormatted ? `<p><b>End Date:</b> ${auditEndDate}</p>` : ''}
            <p>If you believe this was a mistake, please contact the system administrator.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;

        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendAuditInitiationReminder(toEmail, auditID, auditName, auditInitDate, auditEndDate, auditManager) {
        const subject = `Audit Starting Today`;

        // Preparing the text and HTML content
        const initDateFormatted = auditInitDate ? `Start Date: ${auditInitDate}` : '';
        const endDateFormatted = auditEndDate ? `End Date: ${auditEndDate}` : '';
        const text = `
            Hello,

            This is a reminder that the audit ${auditName} (A${auditID}) is starting today.
            
            ${initDateFormatted ? `Start Date: ${auditInitDate}` : ''}
            ${endDateFormatted ? `End Date: ${auditEndDate}` : ''}

            Assigned by: ${auditManager}.
            
            Please open the application to begin your evaluation tasks.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>This is a reminder that the audit <b>${auditName}</b> (A${auditID}) is starting today.</p>
            ${initDateFormatted ? `<p><b>Start Date:</b> ${auditInitDate}</p>` : ''}
            ${endDateFormatted ? `<p><b>End Date:</b> ${auditEndDate}</p>` : ''}
            <p><b>Assigned by:</b> ${auditManager}</p>
            <p>Please open the application to begin your <b>evaluation tasks</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendAuditFinalizationAvertisement(toEmail, auditID, auditName) {
        const subject = `Audit Has Finished`;
        const text = `
            Hello,

            This is an avertisement that the audit ${auditName} (A${auditID}) has finished.

            Please open the application to review the results.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>This is an avertisement that the audit <b>${auditName}</b> (A${auditID}) has finished.</p>
            <p>Please open the application to review the <b>results</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }
    
    static sendAuditEndingSoonReminder(toEmail, auditID, auditName, auditEndDate) {
        const subject = `Audit Ending Soon`;

        // Preparing the text and HTML content
        const endDateFormatted = auditEndDate ? `End Date: ${auditEndDate}` : '';
        const text = `
            Hello,

            This is a reminder that the audit ${auditName} (A${auditID}) will finish in 5 days.

            ${endDateFormatted ? `End Date: ${auditEndDate}` : ''}

            Please open the application to complete your evaluation tasks.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>This is a reminder that the audit <b>${auditName}</b> (A${auditID}) will finish in 5 days.</p>
            ${endDateFormatted ? `<p><b>End Date:</b> ${auditEndDate}</p>` : ''}
            <p>Please open the application to complete your <b>evaluation tasks</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendAuditEvaluatedNotification(toEmail, auditID, auditName) {
        const subject = `Audit Evaluated`;
        const text = `
            Hello,

            The audit ${auditName} (A${auditID}) has been evaluated.

            Please open the application if you want to close it and review the results.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>The audit <b>${auditName}</b> (A${auditID}) has been evaluated.</p>
            <p>Please open the application if you want to close it and review the <b>results</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }

    static sendAuditCloseNotification(toEmail, auditID, auditName) {
        const subject = `Audit Closed`;
        const text = `
            Hello,
            The audit ${auditName} (A${auditID}) has been closed by the audit manager.

            Please open the application to view the final report.

            Best regards,
            The Gaia Tool Support Team.
        `;
        const html = `
            <p>Hello,</p>
            <p>The audit <b>${auditName}</b> (A${auditID}) has been closed by the audit manager.</p>
            <p>Please open the application to view the <b>final report</b>.</p>
            <p>Best regards,<br>The Gaia Tool Support Team.</p>
        `;
        return this.sendEmail(toEmail, subject, text, html);
    }
}

module.exports = EmailService;