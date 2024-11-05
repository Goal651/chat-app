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
    const [showFullImage, setShowFullImage] = useState(false);
    const cropperRef = useRef(null);

    useEffect(() => {
        if (!accessToken) navigate("/login");
    }, [navigate, accessToken]);

    const sendDataToDashboard = () => dataFromProfile(true);

    // Step 1: Handle image cropping and uploading
    const handleImageUpload = async () => {
        if (!cropperRef.current) return;

        const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
        const blob = await new Promise((resolve) => croppedCanvas.toBlob(resolve));

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result.split(",")[1];
            const chunkSize = 50 * 1024; // 100KB chunks
            const totalChunks = Math.ceil(base64data.length / chunkSize);
            const fileName = "profile_image.png"; // Add a name here or use a dynamic one

            // Recursive function to upload each chunk
            const uploadChunk = async (currentChunk) => {
                if (currentChunk >= totalChunks) {
                    console.log("All chunks uploaded successfully.");
                    return;
                }

                const start = currentChunk * chunkSize;
                const end = start + chunkSize;
                const chunk = base64data.substring(start, end);

                try {
                    const response = await fetch("https://chat-app-production-2663.up.railway.app/uploadFile", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            accessToken,
                            name: encodeURIComponent(fileName),
                            totalchunks: totalChunks,
                            currentchunk: currentChunk,
                            typeFolder:'profiles'
                        },
                        body: JSON.stringify({ file: `data:image/png;base64,${chunk}` }),
                    });

                    if (!response.ok) throw new Error(`Failed to upload chunk ${currentChunk}`);

                    const result = await response.json();

                    // If it's the last chunk, update the user profile
                    if (currentChunk === totalChunks - 1) {
                        await updateUserProfile(result.finalFileName);
                    }

                    // Recursively call the next chunk
                    await uploadChunk(currentChunk + 1);
                } catch (err) {
                    console.error(`Error uploading chunk ${currentChunk}:`, err);
                }
            };

            // Start uploading with the first chunk
            await uploadChunk(0);
        };
    };

    
    // Step 2: Update user profile with the uploaded image URL
    const updateUserProfile = async (imageUrl) => {
        try {
            const response = await fetch("https://chat-app-production-2663.up.railway.app/editUserProfile", {
                headers: { accessToken, "Content-Type": "application/json" },
                method: "PUT",
                body: JSON.stringify({ imageUrl }),
            });
            if (response.status === 401) {
                const newAccessToken = await response.json();
                Cookies.set("accessToken", newAccessToken);
                window.location.reload();
            } else if (response.status === 403) {
                navigate("/login");
            } else if (response.ok) {
                setEditing(false);
                sendDataToDashboard();
            }
        } catch (err) {
            console.error("Profile update error:", err);
            navigate("/error");
        }
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditing(true);
            setProfile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const navigateBackward = () => {
        localStorage.removeItem("selectedFriend");
        navigate("/");
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 text-gray-900 rounded-xl">
            {isMobile && (
                <button onClick={navigateBackward} className="btn btn-outline btn-primary my-4 ml-4">
                    ← Back
                </button>
            )}
            {userInfo ? (
                <div className="flex flex-col items-center p-10 mx-auto w-full md:w-1/3 rounded-lg shadow-lg bg-base-100">
                    <div className="cursor-pointer flex flex-col items-center" onClick={() => setShowFullImage(true)}>
                        <div className="avatar mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-primary">
                                {userInfo.imageData ? (
                                    <img src={userInfo.imageData} alt="Profile" className="rounded-full" />
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-2xl font-semibold mt-4">{userInfo.names}</div>
                    </div>
                    <label htmlFor="profile" className="text-primary cursor-pointer mt-2">Edit Profile Image</label>
                    <input id="profile" type="file" className="hidden" onChange={handleChange} />
                </div>
            ) : (
                <div className="flex justify-center items-center min-h-screen">
                    <span className="loading loading-dots text-primary"></span>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="relative w-full md:w-3/4 lg:w-1/2 bg-base-100 p-6 rounded-lg shadow-xl">
                        <div className="flex justify-center overflow-auto max-h-[400px] max-w-full">
                            {imagePreview && (
                                <Cropper
                                    src={imagePreview}
                                    style={{ height: 400, width: "100%" }}
                                    aspectRatio={1}
                                    viewMode={1}
                                    autoCropArea={1}
                                    guides={false}
                                    background={false}
                                    scalable={false}
                                    zoomable={false}
                                    dragMode="none"
                                    ref={cropperRef}
                                    className="rounded-lg"
                                />
                            )}
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={() => setEditing(false)} className="btn btn-outline btn-error">
                                Cancel
                            </button>
                            <button onClick={handleImageUpload} className="btn btn-primary">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFullImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center">
                    <div className="relative">
                        <img
                            src={userInfo.imageData}
                            alt="Full Size Image"
                            className="max-h-screen max-w-screen rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button className="absolute top-2 right-2 btn btn-sm btn-circle btn-error" onClick={() => setShowFullImage(false)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
