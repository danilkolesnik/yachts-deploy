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
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { statusStyles } from '@/utils/statusStyles';

const OfferDetail = ({ params }) => {
    const { id } = use(params);
    const [offer, setOffer] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [role, setRole] = useState(null);
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [pdfExportLoading, setPdfExportLoading] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setRole(localStorage.getItem('role'));
        }
    }, []);

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
            
            const newFileUrl = response.data.file.url;
            
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

    const generateOfferPdf = (offerData) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 14;
        const margin = 14;
        const lineHeight = 7;

        doc.setFontSize(18);
        doc.text('Offer Details', margin, y);
        y += lineHeight + 4;

        doc.setFontSize(11);
        doc.text(`Offer ID: ${offerData.id}`, margin, y);
        y += lineHeight;
        doc.text(`Date: ${new Date(offerData.createdAt).toLocaleString()}`, margin, y);
        y += lineHeight;
        doc.text(`Customer: ${offerData.customerFullName || ''}`, margin, y);
        y += lineHeight;
        doc.text(`Status: ${offerData.status || ''}`, margin, y);
        y += lineHeight;
        if (offerData.location) {
            doc.text(`Location: ${offerData.location}`, margin, y);
            y += lineHeight;
        }
        if (offerData.language) {
            doc.text(`Language: ${offerData.language}`, margin, y);
            y += lineHeight;
        }
        y += lineHeight + 6;

        const yachtsData = Array.isArray(offerData.yachts) && offerData.yachts.length > 0
            ? offerData.yachts.map(yacht => [yacht.name || '', yacht.model || '', yacht.countryCode || ''])
            : [[offerData.yachtName || '', offerData.yachtModel || '', offerData.countryCode || '']];
        autoTable(doc, {
            startY: y,
            head: [['Yacht Name', 'Model', 'Boat Registration']],
            body: yachtsData,
            margin: { left: margin },
            theme: 'grid',
        });
        y = doc.lastAutoTable.finalY + 10;

        const servicesData = Array.isArray(offerData.services) && offerData.services.length > 0
            ? offerData.services.map(s => [s.serviceName || s.label || '', String(s.priceInEuroWithoutVAT ?? '0') + ' €'])
            : (offerData.services && typeof offerData.services === 'object' ? [[offerData.services.serviceName || offerData.services.label || '', String(offerData.services.priceInEuroWithoutVAT ?? '0') + ' €']] : []);
        if (servicesData.length > 0) {
            if (y > 250) { doc.addPage(); y = 14; }
            autoTable(doc, {
                startY: y,
                head: [['Service Name', 'Price (€)']],
                body: servicesData,
                margin: { left: margin },
                theme: 'grid',
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        const partsData = Array.isArray(offerData.parts) && offerData.parts.length > 0
            ? offerData.parts.map(p => [p.label || p.name || p.partName || '', String(p.quantity ?? 1), String(p.pricePerUnit ?? '0') + ' €'])
            : [];
        if (partsData.length > 0) {
            if (y > 240) { doc.addPage(); y = 14; }
            autoTable(doc, {
                startY: y,
                head: [['Part Name', 'Quantity', 'Price per Unit (€)']],
                body: partsData,
                margin: { left: margin },
                theme: 'grid',
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        if (offerData.comment && String(offerData.comment).trim()) {
            if (y > 260) { doc.addPage(); y = 14; }
            doc.setFontSize(12);
            doc.text('Comments', margin, y);
            y += lineHeight;
            doc.setFontSize(10);
            const commentLines = doc.splitTextToSize(offerData.comment, pageWidth - 2 * margin);
            doc.text(commentLines, margin, y);
        }

        doc.save(`offer-${offerData.id}.pdf`);
    };

    const handleExportPdf = () => {
        if (!offer) return;
        setPdfExportLoading(true);
        try {
            generateOfferPdf(offer);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setPdfExportLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailAddress.trim()) {
            alert('Please enter an email address');
            return;
        }

        setEmailLoading(true);
        try {
            const response = await axios.post(`${URL}/offer/${id}/send-email`, 
                { email: emailAddress },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.code === 200) {
                alert('Email sent successfully!');
                setEmailModalOpen(false);
                setEmailAddress('');
            } else {
                alert('Error sending email: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error sending email');
        } finally {
            setEmailLoading(false);
        }
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
                <div className="flex justify-between items-center mb-6">
                    <Button color="blue" onClick={() => router.push('/offers')}>Back</Button>
                    {role !== 'user' && (
                        <div className="flex gap-2">
                            <Button 
                                color="green" 
                                onClick={handleExportPdf}
                                disabled={pdfExportLoading}
                            >
                                {pdfExportLoading ? 'Generating PDF...' : 'Export PDF'}
                            </Button>
                            <Button 
                                color="orange" 
                                onClick={() => setEmailModalOpen(true)}
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Sending...' : 'Send Email'}
                            </Button>
                        </div>
                    )}
                </div>
                <h1 className="text-4xl font-extrabold mb-6 text-black pt-4">Offer Details</h1>
                
                {/* Basic Information */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">ID:</span>
                            <span className="text-black">#{offer.id}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Date:</span>
                            <span className="text-black">{new Date(offer.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Customer:</span>
                            <span className="text-black">{offer.customerFullName || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Status:</span>
                            <span 
                                className="text-black px-3 py-1 rounded"
                                style={{
                                    ...statusStyles[offer.status],
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    display: 'inline-block'
                                }}
                            >
                                {offer.status || 'N/A'}
                            </span>
                        </div>
                        {offer.location && (
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Location:</span>
                                <span className="text-black">{offer.location}</span>
                            </div>
                        )}
                        {offer.language && (
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-800 pr-2 min-w-[120px]">Language:</span>
                                <span className="text-black">{offer.language.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yachts Information */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Yacht Information</h2>
                    {Array.isArray(offer.yachts) && offer.yachts.length > 0 ? (
                        <div className="space-y-4">
                            {offer.yachts.map((yacht, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-semibold text-gray-800">Yacht Name:</span>
                                            <span className="text-black ml-2">{yacht.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800">Model:</span>
                                            <span className="text-black ml-2">{yacht.model || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800">Boat Registration:</span>
                                            <span className="text-black ml-2">{yacht.countryCode || 'N/A'}</span>
                                        </div>
                                        {yacht.userName && (
                                            <div>
                                                <span className="font-semibold text-gray-800">Owner:</span>
                                                <span className="text-black ml-2">{yacht.userName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-semibold text-gray-800">Yacht Name:</span>
                                <span className="text-black ml-2">{offer.yachtName || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800">Model:</span>
                                <span className="text-black ml-2">{offer.yachtModel || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800">Boat Registration:</span>
                                <span className="text-black ml-2">{offer.countryCode || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Services */}
                {(Array.isArray(offer.services) && offer.services.length > 0) || (offer.services && typeof offer.services === 'object' && Object.keys(offer.services).length > 0) ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Services</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Service Name</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Price (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(offer.services) ? (
                                        offer.services.map((service, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 px-4 py-2 text-black">{service.serviceName || service.label || 'N/A'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-black">{service.priceInEuroWithoutVAT || '0'} €</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{offer.services.serviceName || offer.services.label || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{offer.services.priceInEuroWithoutVAT || '0'} €</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}

                {/* Parts */}
                {Array.isArray(offer.parts) && offer.parts.length > 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Parts</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Part Name</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Quantity</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">Price per Unit (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offer.parts.map((part, index) => (
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{part.label || part.name || part.partName || 'N/A'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{part.quantity || 1}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-black">{part.pricePerUnit || '0'} €</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}

                {/* Comment */}
                {offer.comment && String(offer.comment).trim() ? (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">Comments</h2>
                        <p className="text-black whitespace-pre-wrap">{offer.comment}</p>
                    </div>
                ) : null}
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

            {/* Email Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4 text-black">Send Offer PDF to Email</h3>
                        <input
                            type="email"
                            placeholder="Enter email address"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 text-black"
                        />
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="text" 
                                color="red" 
                                onClick={() => {
                                    setEmailModalOpen(false);
                                    setEmailAddress('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                color="green" 
                                onClick={handleSendEmail}
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferDetail;