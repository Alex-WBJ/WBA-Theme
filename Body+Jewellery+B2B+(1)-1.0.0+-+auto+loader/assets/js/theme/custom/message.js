export default class Messages {
    context = null;
    arrMessages = [];
    elMessages = null;

    constructor(context) {
        this.context = context;
    }

    init() {
        // Setup element
        this.elMessages = document.createElement('div');
        this.elMessages.classList.add('messages-list');
        document.body.append(this.elMessages);

        // Bind events
        $(window)
            .on('show-message', (event, message) => {
                this.showMessage(message);
            });
    }

    showMessage(message) {
        const elMessage = document.createElement('div');
        elMessage.classList.add('message');
        elMessage.textContent = message;
        this.elMessages.append(elMessage);

        setTimeout(() => {
            this.elMessages.removeChild(elMessage);
        }, 5000);
    }
}
