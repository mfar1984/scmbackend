-- ============================================================
-- Migration 072: Seed SCM Approved Vendors / Service Suppliers
--   Real SCM approved-vendor directory into ops_vendors.
--   Idempotent — guarded per row by (name, category).
--   AUTO-GENERATED from the website VendorsClient demo data.
-- ============================================================

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Proscan Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Mohd Raznan Ramli' AS contact_person, '+607-2555245' AS phone, '+607-2555246' AS fax, 'pro@proscan.com.my' AS email, 'No. 27, Jalan Siakap 3, Taman Pasir Putih, 81700 Pasir Gudang, Johor, Malaysia.' AS address, '2025-03-20' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Proscan Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Dynanential Engineering Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Mohd Hussein Wagini' AS contact_person, '+607-3889127' AS phone, '+607-3889128' AS fax, 'dyna@dynanential.com.my' AS email, 'No. 42, Jalan Bukit 10, Kawasan Miel, Bandar Seri Alam Fasa VI, 81750 Masai, Johor, Malaysia.' AS address, '2025-03-24' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Dynanential Engineering Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Borneo Welders' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Augustine Kong' AS contact_person, '+6088-496913' AS phone, '+6088-497913' AS fax, 'bw.delliott@yahoo.com' AS email, 'Lot 28, RBF Phase 3, Lorong KKIP 1C, IZ2, KKIP Selatan, 88460 Kota Kinabalu, Sabah, Malaysia.' AS address, '2024-07-22' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Borneo Welders' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'UET Inspection Services' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'C. P. Leong' AS contact_person, '+6012-7373951' AS phone, '+607-3311372' AS fax, 'uetcpleong@gmail.com' AS email, 'Suite #999, MBE Nusa Bestari, Lot PTD 12351, Taman Tan Sri Yaacob, 81200 Johor Bahru, Johor, Malaysia.' AS address, '2025-04-14' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'UET Inspection Services' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PolyNDT Pte. Ltd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Wine Aung' AS contact_person, '+65-67754012' AS phone, '+65-6775401' AS fax, 'polyndt@signet.com.sg' AS email, 'No. 60, Pandan Loop, Pandan Industrial Estate, Singapore 128275.' AS address, '2025-12-11' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PolyNDT Pte. Ltd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Maju NDT Services Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Mujahid Bin Abu Bakar' AS contact_person, '+603-55236853' AS phone, '+603-55132120' AS fax, 'contact@majundt.com' AS email, 'No. 44, Ground Floor, Block 4, Worldwide Business Centre, Seksyen 13, 40100 Shah Alam, Selangor, Malaysia.' AS address, '2023-04-23' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Maju NDT Services Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PT. Maritim Teknik Inspeksi' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Permata Sari' AS contact_person, '+62-81372000343' AS phone, '-' AS fax, 'info@rispek.com' AS email, 'Ruko Tiban Hills, Tiban Baru, Sekupang, Batam, Indonesia 29424.' AS address, '2024-05-18' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PT. Maritim Teknik Inspeksi' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PT. Putra Kahar Riwayati' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Zulkifli Zulkarnaen' AS contact_person, '+62-8117788872' AS phone, '+62-778324510' AS fax, 'pkr@pt-pkr.co.id' AS email, 'Jl. Tiban Koperasi Blok V, No. 1, Tiban Baru, Sekupang, Batam, Indonesia.' AS address, '2025-04-19' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PT. Putra Kahar Riwayati' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'IPI Skill Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Wan Mohd Faiza' AS contact_person, '+6016-6664675' AS phone, '-' AS fax, 'info@ipissbgroup.com' AS email, 'PT 758, Level 2, Bangunan Wisma Puteri Saadong, Jalan Besar Wakaf Bharu, 16250 Wakaf Bharu, Kelantan, Malaysia.' AS address, '2024-03-17' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'IPI Skill Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'A-Star Testing & Inspection (S) Pte. Ltd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Ajay Manjal' AS contact_person, '+65-62616162' AS phone, '+65-62616163' AS fax, 'quality@astartesting.com.sg' AS email, 'No. 5, Soon Lee Street, #03-36/37 Pioneer Point, Singapore 627607.' AS address, '2024-06-18' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'A-Star Testing & Inspection (S) Pte. Ltd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Energy Workforce Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Lingesh Sivalingam' AS contact_person, '+603-40255000' AS phone, '+603-40254000' AS fax, 'info@ewfgroup.com' AS email, 'Unit 82-G, 1 & 2, Kuala Lumpur Traders Square (KLTS), No. 99, Jalan Gombak, 53000 Setapak, Kuala Lumpur, Malaysia.' AS address, '2024-08-26' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Energy Workforce Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Dynasys Technology & Engineering Sdn. Bhd.' AS name, 'Ultrasonic Thickness Measurement' AS category, NULL AS manufacturer, 'Pui Khin Pin' AS contact_person, '+6085-428399' AS phone, '+6085-435501' AS fax, 'purchasing@dynasys.com.my' AS email, 'Lot 1750, Jalan Prunus 3, Piasau Utara 4, 98000 Miri, Sarawak, Malaysia.' AS address, '2025-01-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Dynasys Technology & Engineering Sdn. Bhd.' AND `category` = 'Ultrasonic Thickness Measurement');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Kejuruteraan Purnama Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Muhammad Haniff' AS contact_person, '+609-8502142' AS phone, '+609-8502145' AS fax, 'kpsbkmn@gmail.com' AS email, 'No. 666 A, Jalan Air Putih, 24000 Kemaman, Terengganu, Malaysia.' AS address, '2025-05-21' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Kejuruteraan Purnama Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Nadi Marine Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Zaini Bin Mahamood' AS contact_person, '+607-5073502' AS phone, '+607-5073503' AS fax, 'info@nadimarine.com.my' AS email, 'Lot 6200, Kampung Pekajang, 81560 Gelang Patah, Johor, Malaysia.' AS address, '2024-09-02' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Nadi Marine Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Ezany Resources Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Ahmad Zani Bin Ab Rahman' AS contact_person, '+606-3124531' AS phone, '+606-3125842' AS fax, 'ez_ezany001@yahoo.com' AS email, 'Lot 10735, Batu 12, Bertam Ulu, SPA Highway, 76450 Melaka, Malaysia.' AS address, '2024-03-20' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Ezany Resources Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Oceanic Underwater Services Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Raymond T. S. Tan' AS contact_person, '+603-31686479' AS phone, '+603-31671971' AS fax, 'oceanic_raymondtan@hotmail.com' AS email, 'No. 199, Jalan Kastam, 42000 Port Klang, Selangor, Malaysia.' AS address, '2025-06-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Oceanic Underwater Services Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Advantage Marine Services (Malaysia) Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Derek Siow' AS contact_person, '+6019-7230016' AS phone, '-' AS fax, 'sales@advantagemarine.com.my' AS email, 'Unit 45, Jalan Sentral 2, Taman Nusa Sentral, 79100 Nusajaya, Johor, Malaysia.' AS address, '2025-11-29' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Advantage Marine Services (Malaysia) Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Dive Resources Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Nia Illanie Awanis' AS contact_person, '+607-5096667' AS phone, '-' AS fax, 'sales@diveresources.com.my' AS email, 'No. 4, Jalan Laman Setia 7/8, Taman Laman Setia, 81550 Gelang Patah, Johor, Malaysia.' AS address, '2024-11-23' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Dive Resources Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Globaltechserve Marine Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Farrah Ayshah' AS contact_person, '+603-76522805' AS phone, '+603-76522806' AS fax, 'sales@globaltechservemarine.com' AS email, 'B-3-40, Dataran Cascades, No. 13A, Jalan PJU 5/1, Kota Damansara, 47810 Petaling Jaya, Selangor, Malaysia.' AS address, '2023-10-30' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Globaltechserve Marine Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Weldzone Underwater Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Mohammed Al-Fayed' AS contact_person, '+605-6888545' AS phone, '-' AS fax, 'fayedweldzoneunderwater@gmail.com' AS email, 'Lot PT 10154, Kawasan Perindustrian Seri Manjung, 32040 Seri Manjung, Perak, Malaysia.' AS address, '2023-12-31' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Weldzone Underwater Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Sleipnir Offshore Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Buddie Temban' AS contact_person, '+6013-8497068' AS phone, '+6085-658862' AS fax, 'sales@sleipniroffshore.com' AS email, 'Lot 2401, Block 4, Level 4, No. 4.01, Miri Concession Land District, 98000 Miri, Sarawak, Malaysia.' AS address, '2023-12-24' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Sleipnir Offshore Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Blackpearl Subsea Services (M) Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Fajrul Omar' AS contact_person, '+6014-9658930' AS phone, '-' AS fax, 'admin@bpsubsea.com' AS email, 'Blok A1 5-1, Taman Melati, 53100 Setapak, Kuala Lumpur, Malaysia.' AS address, '2024-09-15' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Blackpearl Subsea Services (M) Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Nakhoda Maritime Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Hisham Ahmad' AS contact_person, '+606-8525669' AS phone, '-' AS fax, 'nakhodamaritime@gmail.com' AS email, 'No. 128-1, Jalan TU 2, Taman Tasik Utama, 75450 Ayer Keroh, Melaka, Malaysia.' AS address, '2024-09-08' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Nakhoda Maritime Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Borneo Subsea Services (Malaysia) Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Jeremy van Houten' AS contact_person, '+6087-417105' AS phone, '+6087-410963' AS fax, 'info@borneosubsea.com' AS email, 'Lot 6879, Bestari Warehouse, Jalan Patau-Patau, 87000 Labuan Federal Territory, Malaysia.' AS address, '2025-01-24' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Borneo Subsea Services (Malaysia) Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Pioneer Pegasus Sdn. Bhd.' AS name, 'In-Water Survey' AS category, NULL AS manufacturer, 'Khairulmuzammil Yuzri' AS contact_person, '+603-55244347' AS phone, '+603-55244346' AS fax, 'mail@pioneerpegasus.com.my' AS email, 'No. 23 & 23A, Jalan Badminton 13/29, Seksyen 13, 40100 Shah Alam, Selangor, Malaysia.' AS address, '2026-02-09' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Pioneer Pegasus Sdn. Bhd.' AND `category` = 'In-Water Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Orion Maritime (M) Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Ahmad Luqman' AS contact_person, '+603-33245023' AS phone, '+603-33245072' AS fax, 'orionmaritime@gmail.com' AS email, '15B, Jalan Bayu Tinggi 2/KS 6, Batu Unjur, 41200 Klang, Selangor, Malaysia.' AS address, '2024-12-26' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Orion Maritime (M) Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Idrisko Technology Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Nai Bin Mohd' AS contact_person, '+603-22821691' AS phone, '+603-22835799' AS fax, 'general@idrisko.com.my' AS email, 'No. 1, Jalan 2/112F, Pantai Indah, Jalan Pantai Dalam, 59200 Kuala Lumpur, Malaysia.' AS address, '2023-05-12' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Idrisko Technology Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Kencom Enterprise Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Lim Fang Ming' AS contact_person, '+6087-413867' AS phone, '+6087-412943' AS fax, 'kencom1983@gmail.com' AS email, 'U0414, 1st Floor, Jalan Bunga Dahlia, 87020 Wilayah Persekutuan Labuan, Malaysia.' AS address, '2024-08-23' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Kencom Enterprise Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Seacom Marine Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Lim Gip Lip' AS contact_person, '+6016-7102008' AS phone, '+6085-664778' AS fax, 'seacomlb@seacom-marine.com' AS email, 'Lot No. 1, Level 2, Labuan Times Square, Jalan Labuan Times Square, 87000 Wilayah Persekutuan Labuan, Malaysia.' AS address, '2026-02-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Seacom Marine Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'MRS Marine Services (M) Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'R. Rajasakal' AS contact_person, '+603-33422204' AS phone, '+603-33422205' AS fax, 'general@mrs-marine.com.my' AS email, 'No. 14, Tingkat 1, Jalan Zapin H/KU5, Taman Mutiara Point, Jalan Meru, 41050 Klang, Selangor, Malaysia.' AS address, '2024-07-16' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'MRS Marine Services (M) Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Norsk Marine Electronic' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Lan Kuen Cheong' AS contact_person, '+65-62754784' AS phone, '+65-62737302' AS fax, 'linkids@singnet.com.sg' AS email, 'No. 71, Bukit Batok Crescent, #09-08 Prestige Centre, Singapore 658071.' AS address, '2023-11-23' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Norsk Marine Electronic' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'World Class Marine Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Ling Tung Huo' AS contact_person, '+6084-212398' AS phone, '+6084-214398' AS fax, 'wcmarine95@gmail.com' AS email, 'No. 1, First Floor, Lorong 7G, Jalan Pahlawan, 96000 Sibu, Sarawak, Malaysia.' AS address, '2024-04-06' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'World Class Marine Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Radii Teknologi Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Goh Eng Hooi' AS contact_person, '+603-31688328' AS phone, '+603-31668328' AS fax, 'sales@radii.com.my' AS email, 'Wisma Radii, No. 327, Jalan Teluk Gadong KS/01, 42000 Port Klang, Selangor, Malaysia.' AS address, '2024-04-02' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Radii Teknologi Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Antara Maritime Services Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Muhammad Fikri Bin Mohd Noor' AS contact_person, '+603-89202889' AS phone, '+603-89201889' AS fax, 'antaramaritime@gmail.com' AS email, '22A-3, Tingkat 3, Jalan Puteri 3A/5, Bandar Puteri Bangi, 43000 Kajang, Selangor, Malaysia.' AS address, '2024-11-24' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Antara Maritime Services Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Tele Time Technology Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Rajalingam Raman' AS contact_person, '+603-33186767' AS phone, '+603-33186767' AS fax, 'general@teletime.com.my' AS email, 'No. 28, Jalan Jasmin 3, Bandar Botanik, 41200 Klang, Selangor, Malaysia.' AS address, '2023-04-02' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Tele Time Technology Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Racom Electronics Sdn. Bhd.' AS name, 'Radio Communication Equipment Survey' AS category, NULL AS manufacturer, 'Cristina Yahakub' AS contact_person, '+603-33453927' AS phone, '+603-33453928' AS fax, 'klang@racom.com.my' AS email, 'No. 6, 1st Floor, Jalan Tiara 5, Bandar Baru Klang, 41150 Klang, Selangor, Malaysia.' AS address, '2024-04-06' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Racom Electronics Sdn. Bhd.' AND `category` = 'Radio Communication Equipment Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Seacom Marine Sdn. Bhd.' AS name, 'Performance Tests of VDR / SVDR' AS category, 'FURUNO' AS manufacturer, 'Lim Gip Lip' AS contact_person, '+6016-7102008' AS phone, '+6085-664778' AS fax, 'seacomlb@seacom-marine.com' AS email, 'Lot No. 1, Level 2, Labuan Times Square, Jalan Labuan Times Square, 87000 Wilayah Persekutuan Labuan, Malaysia.' AS address, '2026-02-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Seacom Marine Sdn. Bhd.' AND `category` = 'Performance Tests of VDR / SVDR');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Radii Teknologi Sdn. Bhd.' AS name, 'Performance Tests of VDR / SVDR' AS category, 'FURUNO' AS manufacturer, 'Goh Eng Hooi' AS contact_person, '+603-31688328' AS phone, '+603-31668328' AS fax, 'sales@radii.com.my' AS email, 'Wisma Radii, No. 327, Jalan Teluk Gadong KS/01, 42000 Port Klang, Selangor, Malaysia.' AS address, '2024-04-02' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Radii Teknologi Sdn. Bhd.' AND `category` = 'Performance Tests of VDR / SVDR');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Racom Electronics Sdn. Bhd.' AS name, 'Performance Tests of VDR / SVDR' AS category, 'JRC' AS manufacturer, 'Cristina Yahakub' AS contact_person, '+603-33453927' AS phone, '+603-33453928' AS fax, 'klang@racom.com.my' AS email, 'No. 6, 1st Floor, Jalan Tiara 5, Bandar Baru Klang, 41150 Klang, Selangor, Malaysia.' AS address, '2024-04-06' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Racom Electronics Sdn. Bhd.' AND `category` = 'Performance Tests of VDR / SVDR');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'MRS Marine Services (M) Sdn. Bhd.' AS name, 'Performance Tests of VDR / SVDR' AS category, 'NSR' AS manufacturer, 'R. Rajasakal' AS contact_person, '+603-33422204' AS phone, '+603-33422205' AS fax, 'general@mrs-marine.com.my' AS email, 'No. 14, Tingkat 1, Jalan Zapin H/KU5, Taman Mutiara Point, Jalan Meru, 41050 Klang, Selangor, Malaysia.' AS address, '2024-07-16' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'MRS Marine Services (M) Sdn. Bhd.' AND `category` = 'Performance Tests of VDR / SVDR');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Index-Cool Corporation (M) Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Stephen Tan' AS contact_person, '+603-31677001' AS phone, '+603-31676014' AS fax, 'sales@index-cool.com.my' AS email, 'No. 6, Jalan Pendamar, Cempaka Emas Industrial Estate, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2025-12-19' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Index-Cool Corporation (M) Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'SHM Shipcare Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Huzefa Zainuddin' AS contact_person, '+603-33235253' AS phone, '-' AS fax, 'malaysia@shmgroup.com' AS email, 'No. 11 & 15, Jalan Rebena, Off Jalan Seruling 59, Taman Klang Jaya, 41200 Klang, Selangor, Malaysia.' AS address, '2025-02-18' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'SHM Shipcare Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Gateway Marketing Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Raven Chiong' AS contact_person, '+6084-327849' AS phone, '+6084-317857' AS fax, 'gatewaysibu@gmail.com' AS email, 'No. 24, Lorong Dr. Wong Soon Kai 4D, 96000 Sibu, Sarawak, Malaysia.' AS address, '2024-04-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Gateway Marketing Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'DS Marine Services Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Sivadassnaidu Maniam' AS contact_person, '+60127778802' AS phone, '-' AS fax, 'services@dsmarine.com.my' AS email, 'No. 16, Jalan SILC 2/14, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor Bahru, Johor, Malaysia.' AS address, '2023-12-16' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'DS Marine Services Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Keisha Marine Services Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Eddie Kong' AS contact_person, '+603-31669717' AS phone, '+603-31669727' AS fax, 'keisha88@keishamarine.com' AS email, 'No. 21 & 23, Jalan Selat Selatan 7/KS05, Taman Perindustrian Sobena Jaya, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2024-05-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Keisha Marine Services Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Ten Marine Safety Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Hamzah Bin Hassan' AS contact_person, '+6017-7447756' AS phone, '-' AS fax, 'ten.marinesb@gmail.com' AS email, 'No. 36, Jalan SILC 2/15, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor, Malaysia.' AS address, '2025-05-31' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Ten Marine Safety Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PT. Batam Marine Indobahari' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Rizki Rahmadi' AS contact_person, '+62-82172750075' AS phone, '-' AS fax, 'info@marinesafetys.co.id' AS email, 'Kompleks Pusat Seken, Bukit Beruntung Blok B VIII No 25-26 Sei Panas Batam, Province Kepulauan Riau, Indonesia.' AS address, '2025-09-15' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PT. Batam Marine Indobahari' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Global Marine Safety & Services (M) Sdn. Bhd.' AS name, 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey' AS category, NULL AS manufacturer, 'Venugopal S' AS contact_person, '+607-3866686' AS phone, '+607-3867686' AS fax, 'gms@gmsmalaysia.com' AS email, 'No. 9, Jalan Cenderai 7, Kawasan Perindustrian Kota Puteri, 81750 Masai, Johor, Malaysia.' AS address, '2025-10-17' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Global Marine Safety & Services (M) Sdn. Bhd.' AND `category` = 'Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Index-Cool Corporation (M) Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Stephen Tan' AS contact_person, '+603-31677001' AS phone, '+603-31676014' AS fax, 'sales@index-cool.com.my' AS email, 'No. 6, Jalan Pendamar, Cempaka Emas Industrial Estate, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2025-12-19' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Index-Cool Corporation (M) Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'SHM Shipcare Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Huzefa Zainuddin' AS contact_person, '+603-33235253' AS phone, '-' AS fax, 'malaysia@shmgroup.com' AS email, 'No. 11 & 15, Jalan Rebena, Off Jalan Seruling 59, Taman Klang Jaya, 41200 Klang, Selangor, Malaysia.' AS address, '2025-02-18' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'SHM Shipcare Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'DS Marine Services Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Sivadassnaidu Maniam' AS contact_person, '+60127778802' AS phone, '-' AS fax, 'services@dsmarine.com.my' AS email, 'No. 16, Jalan SILC 2/14, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor Bahru, Johor, Malaysia.' AS address, '2023-12-16' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'DS Marine Services Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Keisha Marine Services Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Eddie Kong' AS contact_person, '+603-31669717' AS phone, '+603-31669727' AS fax, 'keisha88@keishamarine.com' AS email, 'No. 21 & 23, Jalan Selat Selatan 7/KS05, Taman Perindustrian Sobena Jaya, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2024-05-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Keisha Marine Services Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Ten Marine Safety Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Hamzah Bin Hassan' AS contact_person, '+6017-7447756' AS phone, '-' AS fax, 'ten.marinesb@gmail.com' AS email, 'No. 36, Jalan SILC 2/15, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor, Malaysia.' AS address, '2025-05-31' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Ten Marine Safety Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PT. Batam Marine Indobahari' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Rizki Rahmadi' AS contact_person, '+62-82172750075' AS phone, '-' AS fax, 'info@marinesafetys.co.id' AS email, 'Kompleks Pusat Seken, Bukit Beruntung Blok B VIII No 25-26 Sei Panas Batam, Province Kepulauan Riau, Indonesia.' AS address, '2025-09-15' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PT. Batam Marine Indobahari' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Global Marine Safety & Services (M) Sdn. Bhd.' AS name, 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service' AS category, NULL AS manufacturer, 'Venugopal S' AS contact_person, '+607-3866686' AS phone, '+607-3867686' AS fax, 'gms@gmsmalaysia.com' AS email, 'No. 9, Jalan Cenderai 7, Kawasan Perindustrian Kota Puteri, 81750 Masai, Johor, Malaysia.' AS address, '2025-10-17' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Global Marine Safety & Services (M) Sdn. Bhd.' AND `category` = 'Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Index-Cool Corporation (M) Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Stephen Tan' AS contact_person, '+603-31677001' AS phone, '+603-31676014' AS fax, 'sales@index-cool.com.my' AS email, 'No. 6, Jalan Pendamar, Cempaka Emas Industrial Estate, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2025-12-19' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Index-Cool Corporation (M) Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'SHM Shipcare Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Huzefa Zainuddin' AS contact_person, '+603-33235253' AS phone, '-' AS fax, 'malaysia@shmgroup.com' AS email, 'No. 11 & 15, Jalan Rebena, Off Jalan Seruling 59, Taman Klang Jaya, 41200 Klang, Selangor, Malaysia.' AS address, '2025-02-18' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'SHM Shipcare Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'First Marine Services (M) Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Meor Amir Faizal' AS contact_person, '+609-5736333' AS phone, '+609-5737633' AS fax, 'meor@fms.com.my' AS email, 'Lot 35, Sektor 1, Jalan IM 3/6, Bandar Indera Mahkota, 25200 Kuantan, Pahang, Malaysia.' AS address, '2023-08-05' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'First Marine Services (M) Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'DS Marine Services Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Sivadassnaidu Maniam' AS contact_person, '+60127778802' AS phone, '-' AS fax, 'services@dsmarine.com.my' AS email, 'No. 16, Jalan SILC 2/14, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor Bahru, Johor, Malaysia.' AS address, '2023-12-16' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'DS Marine Services Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Keisha Marine Services Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Eddie Kong' AS contact_person, '+603-31669717' AS phone, '+603-31669727' AS fax, 'keisha88@keishamarine.com' AS email, 'No. 21 & 23, Jalan Selat Selatan 7/KS05, Taman Perindustrian Sobena Jaya, Pandamaran, 42000 Port Klang, Selangor, Malaysia.' AS address, '2024-05-25' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Keisha Marine Services Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Ten Marine Safety Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Hamzah Bin Hassan' AS contact_person, '+6017-7447756' AS phone, '-' AS fax, 'ten.marinesb@gmail.com' AS email, 'No. 36, Jalan SILC 2/15, Kawasan Perindustrian SILC, 79200 Iskandar Puteri, Johor, Malaysia.' AS address, '2025-05-31' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Ten Marine Safety Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'PT. Batam Marine Indobahari' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Rizki Rahmadi' AS contact_person, '+62-82172750075' AS phone, '-' AS fax, 'info@marinesafetys.co.id' AS email, 'Kompleks Pusat Seken, Bukit Beruntung Blok B VIII No 25-26 Sei Panas Batam, Province Kepulauan Riau, Indonesia.' AS address, '2025-09-15' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'PT. Batam Marine Indobahari' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Global Marine Safety & Services (M) Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Venugopal S' AS contact_person, '+607-3866686' AS phone, '+607-3867686' AS fax, 'gms@gmsmalaysia.com' AS email, 'No. 9, Jalan Cenderai 7, Kawasan Perindustrian Kota Puteri, 81750 Masai, Johor, Malaysia.' AS address, '2025-10-17' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Global Marine Safety & Services (M) Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Berkat Offshore Solution Sdn. Bhd.' AS name, 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service' AS category, NULL AS manufacturer, 'Satthea Jagathesan' AS contact_person, '+606-6013048' AS phone, '-' AS fax, 'inquiry@berkatoffshore.com' AS email, 'No. 221, 1st Floor, Jalan S2 B10, Uptown Avenue, Seremban 2, 70300 Seremban, Negeri Sembilan.' AS address, '2026-01-17' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Berkat Offshore Solution Sdn. Bhd.' AND `category` = 'Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'SGS (Malaysia) Sdn. Bhd.' AS name, 'BWMS Commissioning Testing' AS category, NULL AS manufacturer, 'Muhammad Syahir Bin Mohd Nawi' AS contact_person, '+603-76270080' AS phone, '+603-76270082' AS fax, 'syahir.mohdnawi@sgs.com' AS email, 'Lot 3 & 4, Persiaran Jubli Perak, Seksyen 22, 40300 Shah Alam, Selangor, Malaysia.' AS address, '2025-08-30' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'SGS (Malaysia) Sdn. Bhd.' AND `category` = 'BWMS Commissioning Testing');

INSERT INTO `ops_vendors` (`source`, `name`, `category`, `manufacturer`, `contact_person`, `phone`, `fax`, `email`, `address`, `expiry_date`, `status`)
SELECT * FROM (SELECT 'Manual' AS source, 'Goltens Singapore Pte. Ltd.' AS name, 'BWMS Commissioning Testing' AS category, NULL AS manufacturer, 'Glen Chong' AS contact_person, '+65-68615220' AS phone, '+65-68611037' AS fax, 'singapore@goltens.com' AS email, 'No. 6A Benoi Road, Singapore 629881.' AS address, '2025-11-15' AS expiry_date, 'Active' AS status) AS t
WHERE NOT EXISTS (SELECT 1 FROM `ops_vendors` WHERE `name` = 'Goltens Singapore Pte. Ltd.' AND `category` = 'BWMS Commissioning Testing');

