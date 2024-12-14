export default function NotificationBanner(details) {
    if (Notification.permission !== 'granted') return
    if (details) {
        const notification = new Notification(details.title, {
            body: details.body,
            icon: `${details.userDetails.image ? details.userDetails.imageData : '/image.png'}`,
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}