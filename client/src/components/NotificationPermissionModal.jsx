import PropTypes from 'prop-types';

NotificationPermissionModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onAllow: PropTypes.func.isRequired,
}

const NotificationPermissionModal = ({ onClose, onAllow }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold">Enable Notifications</h3>
                <p className="mt-2 text-sm">
                    To stay updated with messages and activities, please allow notifications.
                </p>
                <div className="mt-4 flex justify-between">
                    <button
                        onClick={onAllow}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                        Allow
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-200"
                    >
                        No, thanks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPermissionModal;
