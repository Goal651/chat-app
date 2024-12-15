import NotificationBanner from "../components/NotificationBanner";
export default function Testing() {

    const testNotification = () => {
        NotificationBanner({
            title: 'This is wigo',
            body: 'and this ti',
        });
    }
    return (
        <div className="flex flex-col items-center p-4">

            <button
                onClick={testNotification}
                className="btn btn-primary"
            >TESTING</button>
        </div>
    );
}
