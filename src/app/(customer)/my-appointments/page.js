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
// เพิ่ม Icon ใบไม้แบบ SVG ที่นี่
// เราจะใช้ไอคอนนี้แทนวงกลมหมุนๆ
const SpaLeafIcon = ({ className = "w-10 h-10", color = "#553734" }) => (
    <svg 
        className={className} 
        fill={color} 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.75 16.2c-1.4.63-2.92.93-4.52.93-3.6 0-6.48-2.3-7.5-5.5.95 2.15 2.86 3.8 5.17 4.54l1.85-.75c-.88-.42-1.63-.98-2.2-1.66-2.02 1.34-3.1 3.55-3.1 6.07 0 3.86 2.76 7 6.5 7 2.05 0 3.9-.88 5.2-2.38l-.94-.96c-1.07.98-2.45 1.54-3.96 1.54-3.6 0-6.48-2.3-7.5-5.5.95 2.15 2.86 3.8 5.17 4.54l1.85-.75c-.88-.42-1.63-.98-2.2-1.66-2.02 1.34-3.1 3.55-3.1 6.07 0 3.86 2.76 7 6.5 7 2.05 0 3.9-.88 5.2-2.38l-.94-.96c-1.07.98-2.45 1.54-3.96 1.54zm-2.92-3.8c-.8.58-1.74.9-2.78.9-.4 0-.78-.04-1.15-.12.5 1.13 1.25 2.02 2.22 2.65l1.71-.85c-.4-.2-2.08-1.54-2.08-3.08 0-1.85 1.6-3.3 3.4-3.3.45 0 .88.08 1.28.23L15.5 8c-.62-.12-1.28-.18-1.95-.18-3.6 0-6.48 2.3-7.5 5.5.95-2.15 2.86-3.8 5.17-4.54l1.85.75c-.88.42-1.63.98-2.2 1.66-2.02-1.34-3.1-3.55-3.1-6.07 0-3.86 2.76-7 6.5-7 2.05 0 3.9.88 5.2 2.38l-.94.96c-1.07-.98-2.45-1.54-3.96-1.54zm-2.92-3.8c-.8.58-1.74.9-2.78.9-.4 0-.78-.04-1.15-.12.5 1.13 1.25 2.02 2.22 2.65l1.71-.85c-.4-.2-2.08-1.54-2.08-3.08 0-1.85 1.6-3.3 3.4-3.3.45 0 .88.08 1.28.23L15.5 8c-.62-.12-1.28-.18-1.95-.18-3.6 0-6.48 2.3-7.5 5.5.95-2.15 2.86-3.8 5.17-4.54l1.85.75c-.88.42-1.63.98-2.2 1.66-2.02-1.34-3.1-3.55-3.1-6.07 0-3.86 2.76-7 6.5-7 2.05 0 3.9.88 5.2 2.38l-.94.96c-1.07-.98-2.45-1.54-3.96-1.54z"/>
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


    // --- แก้ไข Loading หน้าแรก (LIFF) เป็น Icon ใบไม้หมุนๆ ---
    if (liffLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <SpaLeafIcon className="w-16 h-16 animate-spin" color="#553734" />
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
                
                {/* --- แก้ไข Loading รายการนัดหมาย เป็น Icon ใบไม้หมุนๆ --- */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                         <SpaLeafIcon className="w-14 h-14 animate-spin" color="#553734" />
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
