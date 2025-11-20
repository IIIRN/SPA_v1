// src/app/(customer)/my-appointments/page.js
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { useLiffContext } from '@/context/LiffProvider';
import { Notification, ConfirmationModal } from '@/app/components/common/NotificationComponent';
import { cancelAppointmentByUser, confirmAppointmentByUser } from '@/app/actions/appointmentActions'; // Import new action
import AppointmentCard from './AppointmentCard';
import QrCodeModal from '@/app/components/common/QrCodeModal';
import HistoryCard from './history/HistoryCard';
import CustomerHeader from '@/app/components/CustomerHeader';

// ----------------------------------------------------
// เปลี่ยนเป็น Icon ดอกไม้แบบ SVG ที่นี่
const SpaFlowerIcon = ({ className = "w-10 h-10", color = "#553734" }) => (
    <svg 
        className={className} 
        fill={color} 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM12 4c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1zm0 16c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zM4 12c0-.55.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1zm16 0c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1zM5.64 5.64c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.64 5.64zM18.36 5.64c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.41 1.41c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.41-1.41zM5.64 18.36c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.41 1.41zM18.36 18.36c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0l-1.41-1.41c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0l1.41 1.41z"/>
    </svg>
);
// ----------------------------------------------------


export default function MyAppointmentsPage() {
    const { profile, loading: liffLoading, error: liffError } = useLiffContext();
    const [appointments, setAppointments] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'success' });
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => setNotification({ ...notification, show: false }), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (liffLoading || !profile?.userId) {
            if (!liffLoading) setLoading(false);
            return;
        }
        setLoading(true);
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            where("userId", "==", profile.userId),
            where("status", "in", ['awaiting_confirmation', 'confirmed', 'in_progress']),
            orderBy("appointmentInfo.dateTime", "asc")
        );
        const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAppointments(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setNotification({ show: true, title: 'Error', message: 'Could not fetch appointments.', type: 'error' });
            setLoading(false);
        });
        
        const fetchHistory = async () => {
            try {
                const bookingsQuery = query(
                    collection(db, 'appointments'),
                    where("userId", "==", profile.userId),
                    where("status", "in", ["completed", "cancelled"]),
                    orderBy("appointmentInfo.dateTime", "desc")
                );
                const querySnapshot = await getDocs(bookingsQuery);
                const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistoryBookings(bookingsData);
            } catch (error) {
                console.error("Error fetching booking history:", error);
            }
        };
        fetchHistory();
        return () => unsubscribe();
    }, [profile, liffLoading]);

    const handleQrCodeClick = (appointmentId) => {
        setSelectedAppointmentId(appointmentId);
        setShowQrModal(true);
    };

    const handleCancelClick = (appointment) => {
        setAppointmentToCancel(appointment);
    };

    const confirmCancelAppointment = async () => {
        if (!appointmentToCancel || !profile?.userId) return;
        setIsCancelling(true);
        const result = await cancelAppointmentByUser(appointmentToCancel.id, profile.userId);

        if (result.success) {
            setNotification({ show: true, title: 'สำเร็จ', message: 'การนัดหมายของคุณถูกยกเลิกแล้ว', type: 'success' });
        } else {
            setNotification({ show: true, title: 'ผิดพลาด', message: result.error, type: 'error' });
        }
        setIsCancelling(false);
        setAppointmentToCancel(null);
    };

    const handleConfirmClick = async (appointment) => {
        if (!profile?.userId) return;
        setIsConfirming(true);
        const result = await confirmAppointmentByUser(appointment.id, profile.userId);
        if (result.success) {
            setNotification({ show: true, title: 'สำเร็จ', message: 'ยืนยันการนัดหมายเรียบร้อย', type: 'success' });
        } else {
            setNotification({ show: true, title: 'ผิดพลาด', message: result.error, type: 'error' });
        }
        setIsConfirming(false);
    };


    // --- แก้ไข Loading หน้าแรก (LIFF) เป็น Icon ดอกไม้หมุนๆ ---
    if (liffLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <SpaFlowerIcon className="w-16 h-16 animate-spin" color="#553734" />
                <p className="mt-4 text-gray-700 text-lg">กำลังโหลด...</p>
            </div>
        );
    }
    // --------------------------------------------------------

    if (liffError) return <div className="p-4 text-center text-red-500">LIFF Error: {liffError}</div>;

    return (
        <div>
            <CustomerHeader showBackButton={false} showActionButtons={true} />
            <div className="p-4 space-y-5">
            <Notification {...notification} />
            <ConfirmationModal
                show={!!appointmentToCancel}
                title="ยืนยันการยกเลิก"
                message={`คุณต้องการยกเลิกการนัดหมายบริการ ${appointmentToCancel?.serviceInfo.name} ใช่หรือไม่?`}
                onConfirm={confirmCancelAppointment}
                onCancel={() => setAppointmentToCancel(null)}
                isProcessing={isCancelling}
            />
            <QrCodeModal
                show={showQrModal}
                onClose={() => setShowQrModal(false)}
                appointmentId={selectedAppointmentId}
            />
            
            <div className="space-y-4">
                <div className="font-bold text-md text-gray-700">นัดหมายของฉัน</div>
                
                {/* --- แก้ไข Loading รายการนัดหมาย เป็น Icon ดอกไม้หมุนๆ --- */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                         <SpaFlowerIcon className="w-14 h-14 animate-spin" color="#553734" />
                         <p className="mt-3 text-gray-600">กำลังโหลดรายการนัดหมาย...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10 bg-white p-8 rounded-xl shadow-sm">
                        <p className="font-semibold">ไม่มีรายการนัดหมายที่กำลังดำเนินอยู่</p>
                    </div>
                ) : (
                    appointments.map((job) => (
                        <AppointmentCard
                            key={job.id}
                            job={job}
                            onQrCodeClick={handleQrCodeClick}
                            onCancelClick={handleCancelClick}
                            onConfirmClick={handleConfirmClick}
                            isConfirming={isConfirming}
                        />
                    ))
                )}
                {/* ------------------------------------------------------ */}

            </div>
            
            <div className="flex flex-col items-center mt-6">
                <button
                    className="text-primary flex items-center gap-2 focus:outline-none"
                    onClick={() => setShowHistory(v => !v)}
                >
                    <span className="text-md">{showHistory ? '▲ ซ่อนประวัติที่ผ่านมา' : '▼ ดูประวัติที่ผ่านมา'}</span>
                </button>
            </div>
            
            {showHistory && (
                <div className="space-y-4 mt-2">
                    <div className="text-sm text-gray-700">ประวัติการใช้บริการ</div>
                    {historyBookings.length === 0 ? (
                        <div className="text-center text-gray-500 pt-10 bg-white p-8 rounded-xl">
                            <p>ยังไม่มีประวัติการใช้บริการ</p>
                        </div>
                    ) : (
                        historyBookings.map(job => (
                            <HistoryCard
                                key={job.id}
                                appointment={job}
                                onBookAgain={() => { window.location.href = '/appointment'; }}
                            />
                        ))
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
