"use client"
import React, { use, useState, useEffect } from 'react';
import { URL } from '@/utils/constants';
import { Button } from "@material-tailwind/react";
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Header from '@/component/header';
import Loader from '@/ui/loader';
import Image from 'next/image';
import ReactPlayer from 'react-player';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";

const OfferDetail = ({ params }) => {
    const { id } = use(params);
    const [offer, setOffer] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            axios.get(`${URL}/offer/${id}`)
                .then(response => setOffer(response.data.data))
                .catch(error => console.error('Error fetching offer:', error));
        }
    }, [id]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            const response = await axios.post(`${URL}/upload/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newFileUrl = `${URL}/${response.data.file.path.replace(/\\/g, '/')}`;
            if (selectedFile.type.startsWith('video/')) {
                setOffer((prevOffer) => ({
                    ...prevOffer,
                    videoUrls: [...prevOffer.videoUrls, newFileUrl],
                }));
            } else {
                setOffer((prevOffer) => ({
                    ...prevOffer,
                    imageUrls: [...prevOffer.imageUrls, newFileUrl],
                }));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (url) => {
        try {
            await axios.post(`${URL}/upload/delete`, { url, offerId: id });
            setOffer((prevOffer) => ({
                ...prevOffer,
                imageUrls: prevOffer.imageUrls.filter((imageUrl) => imageUrl !== url),
                videoUrls: prevOffer.videoUrls.filter((videoUrl) => videoUrl !== url),
            }));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setShowGallery(true);
    };

    const images = offer?.imageUrls?.map(url => ({
        original: url,
        thumbnail: url,
        originalAlt: 'Offer Image',
        thumbnailAlt: 'Offer Image Thumbnail'
    })) || [];

    if (!offer) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
                <Button color="blue" onClick={() => router.push('/offers')}>Back</Button>
                <h1 className="text-4xl font-extrabold mb-6 text-black pt-4">Offer Details</h1>
                <div className="space-y-6">
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-800 pr-2">ID:</span>
                        <span className="text-black">{offer.id}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-800 pr-2">Customer:</span>
                        <span className="text-black">{offer.customerFullName}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-800 pr-2">Yacht Name:</span>
                        <span className="text-black">{offer.yachtName}</span>
                    </div>
                </div>
                {offer.imageUrls.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Images</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {offer.imageUrls.map((url, index) => (
                                <div key={index} className="relative group cursor-pointer" onClick={() => handleImageClick(index)}>
                                    <Image
                                        src={url}
                                        alt={`Offer Image ${index + 1}`}
                                        width={500}
                                        height={300}
                                        className="w-full h-auto rounded-lg shadow-md transition-transform transform group-hover:scale-105"
                                    />
                                    {role != 'user' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(url);
                                            }}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6 bg-white rounded-full p-1" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {offer.videoUrls && offer.videoUrls.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Videos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {offer.videoUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <ReactPlayer
                                        url={url}
                                        controls
                                        width="100%"
                                        height="100%"
                                        className="rounded-lg shadow-md"
                                    />
                                    {role !== 'user' && (
                                        <button
                                            onClick={() => handleDelete(url)}
                                            className="absolute top-1 right-1 text-black rounded-full p-2 transition-colors"
                                        >
                                            <XMarkIcon className="w-6 h-6 bg-white rounded-full p-1" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {role != 'user' && (
                    <div className="mt-10">
                        <h2 className="text-3xl font-bold mb-6 text-black">Upload New File</h2>
                        <input 
                            type="file" 
                            onChange={handleFileChange} 
                            className="text-sm text-stone-500
                            file:mr-5 file:py-1 file:px-3 file:border-[1px]
                            file:text-xs file:font-medium
                            file:bg-stone-50 file:text-stone-700
                            hover:file:cursor-pointer hover:file:bg-blue-50
                            hover:file:text-blue-700"
                        />
                        <button
                            onClick={handleUpload}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                )}
            </div>

            {showGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="w-full h-full p-4">
                        <div className="relative w-full h-full">
                            <ImageGallery
                                items={images}
                                startIndex={selectedImageIndex}
                                showFullscreenButton={true}
                                showPlayButton={false}
                                showThumbnails={true}
                                showNav={true}
                                showBullets={true}
                                infinite={true}
                                slideInterval={3000}
                                slideOnThumbnailOver={true}
                                thumbnailPosition="bottom"
                                onClick={() => setShowGallery(false)}
                            />
                            <button
                                onClick={() => setShowGallery(false)}
                                className="absolute top-4 right-4 text-white z-50 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferDetail;