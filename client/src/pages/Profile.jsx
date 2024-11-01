/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

export default function Profile({ dataFromProfile, isMobile, userInfo }) {
    const navigate = useNavigate();
    const accessToken = Cookies.get("accessToken");
    const [profile, setProfile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [editing, setEditing] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false)
    const cropperRef = useRef(null); 

    useEffect(() => { if (!accessToken) navigate("/login") }, [navigate, accessToken]);

    const sendDataToDashboard = () => dataFromProfile(true);

    const handleEdit = async () => {
        if (cropperRef.current) {
            const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
            croppedCanvas.toBlob(async (blob) => {
                const formDataToSend = new FormData();
                formDataToSend.append("image", blob); // Send cropped image as blob

                try {
                    const response = await fetch("https://chat-app-production-2663.up.railway.app/editUser/profile", {
                        headers: { accessToken: `${accessToken}` },
                        method: "PUT",
                        body: formDataToSend,
                    });
                    const newAccessToken = await response.json();
                    if (response.status === 401) {
                        Cookies.set("accessToken", newAccessToken);
                        window.location.reload();
                    } else if (response.status === 403) {
                        navigate("/login");
                    } else if (response.ok) {
                        setEditing(false);
                        sendDataToDashboard();
                    }
                } catch (err) {
                    navigate("/error");
                }
            });
        }
    };

    const handleChange = (e) => {
        setEditing(true);
        const file = e.target.files[0];
        setProfile(file);
        setImagePreview(URL.createObjectURL(file)); // Create image preview
    };

    const navigateBackward = () => {
        localStorage.removeItem("selectedFriend");
        navigate("/");
    };

    const handleImageClick = () => {
        setShowFullImage(true); // Show the full-size image when clicked
    };

    const closeFullImageModal = () => {
        setShowFullImage(false); // Close the modal when clicking outside the image or the close button
    };

    return (
        <div className={`h-full flex flex-col bg-gray-100 text-gray-900 rounded-xl`}>
            {isMobile && (
                <button onClick={navigateBackward} className="btn btn-outline btn-primary my-4 ml-4">
                    ← Back
                </button>
            )}
            {userInfo ? (
                <div className="flex flex-col items-center p-10 mx-auto w-full  md:w-1/3 rounded-lg shadow-lg bg-base-100">
                    <div className="cursor-pointer flex flex-col items-center">
                        <div className="avatar mb-4" onClick={handleImageClick}> {/* Add click handler */}
                            <div className="w-32 h-32 rounded-full border-4 border-primary">
                                {userInfo.imageData ? (
                                    <img
                                        src={userInfo.imageData}
                                        alt="Fetched Image"
                                        className="rounded-full" />
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div> <div className="text-2xl font-semibold mt-4">{userInfo.names}</div>
                    <label htmlFor="profile" className="text-primary">Edit Profile Image</label>
                    <input id="profile" name="profile" type="file" className="hidden" onChange={handleChange} />
                </div>
            ) : (
                <div className="flex justify-center items-center min-h-screen">
                    <span className="loading loading-dots text-primary"></span>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex flex-col justify-center items-center z-50 overflow-auto">
                    <div className="relative w-full md:w-3/4 lg:w-1/2 bg-base-100 p-6 rounded-lg shadow-xl">
                        <div className="flex justify-center overflow-auto max-h-[400px] max-w-full"> {/* Make it scrollable */}
                            {imagePreview && (
                                <Cropper
                                    src={imagePreview}
                                    style={{ height: 400, width: "100%" }}
                                    aspectRatio={1} // Maintain 1:1 aspect ratio
                                    viewMode={1} // Restrict to the crop box
                                    autoCropArea={1} // Automatically crop the whole image
                                    guides={false}
                                    background={false}
                                    scalable={false} // Disable resizing of image
                                    zoomable={false} // Disable zooming
                                    dragMode="none" // Disable drag-and-drop within the crop box
                                    ref={cropperRef}
                                    className="rounded-lg"
                                />
                            )}
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={() => setEditing(false)} className="btn btn-outline btn-error">
                                Cancel
                            </button>
                            <button onClick={handleEdit} className="btn btn-primary">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFullImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center border-4 border-red-600"
                    onClick={closeFullImageModal}>
                    <div className="relative">
                        <img
                            src={userInfo.imageData}
                            alt="Full Size Image"
                            className="max-h-screen max-w-screen rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button className="absolute top-2 right-2 btn btn-sm btn-circle btn-error" onClick={closeFullImageModal}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
