"use client";

import { useLiffContext } from '@/context/LiffProvider';
import Image from 'next/image';
import { db } from '@/app/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerHeader({ showBackButton = false, showActionButtons = true }) {
    const { profile, loading: liffLoading, error: liffError } = useLiffContext();
    const [customerData, setCustomerData] = useState(null);
    const [dbError, setDbError] = useState(null); // เพิ่ม State สำหรับเก็บ Error
    const router = useRouter();

    useEffect(() => {
        let unsubscribe = () => { };
        
        // ตรวจสอบว่ามี profile และ userId จริงๆ
        if (!liffLoading && profile?.userId) {
            // Debug: เช็คว่ากำลังดึงข้อมูลของ User ID ไหน
            // console.log("Fetching data for UserID:", profile.userId); 

            const customerRef = doc(db, "customers", profile.userId);
            
            unsubscribe = onSnapshot(customerRef, (doc) => {
                if (doc.exists()) {
                    setCustomerData(doc.data());
                    setDbError(null); // เคลียร์ Error ถ้าโหลดสำเร็จ
                } else {
                    console.warn("ไม่พบข้อมูลลูกค้าใน Database (อาจเป็นลูกค้าใหม่)");
                    setCustomerData({ points: 0 }); // กำหนดค่าเริ่มต้น
                }
            }, (error) => {
                // เพิ่มส่วนจัดการ Error
                console.error("Firebase Error:", error);
                setDbError("เชื่อมต่อข้อมูลไม่สำเร็จ");
            });
        }
        return () => unsubscribe();
    }, [profile, liffLoading]);

    // ถ้า LIFF ยังโหลดไม่เสร็จ ให้แสดง Loading ว่างๆ หรือ Skeleton ก็ได้
    if (liffLoading) return <div className="p-6 bg-primary animate-pulse h-32"></div>;
    
    // ถ้า LIFF Error
    if (liffError) return null;

    return (
        <div className="p-6 bg-primary">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {profile?.pictureUrl ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                            <Image src={profile.pictureUrl} width={56} height={56} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-800 flex-shrink-0 border-2 border-white/20" />
                    )}
                    <div>
                        <p className="text-sm text-primary-dark opacity-80">สวัสดี</p>
                        <p className="font-semibold text-primary-dark text-lg">
                            {profile?.displayName || 'ผู้ใช้'}
                        </p>
                        {/* แสดง Error ถ้ามี */}
                        {dbError && <p className="text-xs text-red-600 bg-white/80 px-1 rounded mt-1">{dbError}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-background rounded-full px-5 py-2 text-primary-dark font-medium text-md shadow-sm flex flex-col items-end min-w-[100px]">
                        <span className="text-lg leading-none">{customerData?.points ?? 0}</span>
                        <span className="text-xs text-gray-500">พ้อยท์</span>
                    </div>
                </div>
            </header>

            {showActionButtons && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => router.push('/appointment')}
                        className="bg-primary-dark text-primary-light rounded-full py-3 font-medium text-base hover:shadow-md transition-all active:scale-95 border border-gray-200"
                    >
                        จองบริการ
                    </button>
                    <button
                        onClick={() => router.push('/my-coupons')}
                        className="bg-white text-gray-800 rounded-full py-3 font-medium text-base hover:shadow-md transition-all active:scale-95 border border-gray-200"
                    >
                        คูปองของฉัน
                    </button>
                </div>
            )}
        </div>
    );
}
