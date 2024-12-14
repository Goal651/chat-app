export default function NotificationBanner(details) {
    if (Notification.permission !== 'granted') return
    if (details) {
        const notification = new Notification(details.title, { body: details.body, icon: '/vite.svg' });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}