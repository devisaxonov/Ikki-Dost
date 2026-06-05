# Ikki Dost Loyihasini Ubuntu Serverga Yuklash Qo'llanmasi

Ushbu qo'llanma orqali siz **Ikki Dost** loyihasini (Front-end, Admin, va NestJS Backend) toza Ubuntu serveriga to'liq o'rnatib, ishga tushirishingiz mumkin.

---

## 1. Dastlabki tayyorgarlik (Kerakli dasturlarni o'rnatish)

Serveringizga (masalan, SSH orqali) ulangandan so'ng tizimni yangilang:
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.1. Node.js va npm o'rnatish (20-versiya)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.2. PM2 (Backendni fonda ishlatish uchun)
```bash
sudo npm install -g pm2
```

### 1.3. Nginx va Git o'rnatish
```bash
sudo apt install -y nginx git
```

### 1.4. PostgreSQL o'rnatish
```bash
sudo apt install -y postgresql postgresql-contrib
```

---

## 2. Ma'lumotlar bazasini (PostgreSQL) sozlash

PostgreSQL terminaliga kiring:
```bash
sudo -u postgres psql
```
Bazada foydalanuvchi va ma'lumotlar bazasini yarating (parolni o'zingiz xohlaganday o'zgartirishingiz mumkin):
```sql
CREATE DATABASE ikki_dost_app;
CREATE USER db_user WITH ENCRYPTED PASSWORD 'kuchli_parol_yozing';
GRANT ALL PRIVILEGES ON DATABASE ikki_dost_app TO db_user;
\q
```
*(Eslatma: Agar bazani aynan kompyuteringizdagi kabi `postgres` foydalanuvchisi bilan ishlatmoqchi bo'lsangiz, faqat unga parol o'rnatsangiz ham bo'ladi).*

---

## 3. Loyihani Serverga yuklab olish

Dasturlarni saqlash uchun qulay joyga (masalan `/var/www/` ga) loyihani Git orqali ko'chirib oling:
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/devisaxonov/Ikki-Dost.git ikki-dost
sudo chown -R $USER:$USER /var/www/ikki-dost
cd ikki-dost
```

---

## 4. Muhit o'zgaruvchilarini (.env) sozlash

### BACKEND/.env
Backend papkasiga kirib `.env` faylini yarating:
```bash
cd /var/www/ikki-dost/BACKEND
nano .env
```
Fayl ichiga kompyuteringizdagi sozlamalarni kiriting, bazaning manzili quyidagicha bo'ladi:
```env
DATABASE_URL="postgresql://db_user:kuchli_parol_yozing@localhost:5432/ikki_dost_app?schema=public"
JWT_SECRET="juda_murakkab_sirli_kalit_yozing"
JWT_EXPIRES_IN="7d"
CORS_ORIGINS="http://yourdomain.com,https://yourdomain.com"
PORT=8080
```

### FRONTEND va ADMIN uchun .env
```bash
cd /var/www/ikki-dost/FRONTEND
nano .env
# VITE_API_URL="/api" yozib saqlang

cd /var/www/ikki-dost/ADMIN
nano .env
# VITE_API_URL="/api" yozib saqlang
```

---

## 5. Front-end va Admin ni Build qilish (Tayyorlash)

### Frontend:
```bash
cd /var/www/ikki-dost/FRONTEND
npm install
npm run build
```

### Admin:
```bash
cd /var/www/ikki-dost/ADMIN
npm install
npm run build
```
Shundan so'ng, ikkala papka ichida ham `dist` papkasi paydo bo'ladi.

---

## 6. Backendni ishga tushirish (NestJS & Prisma)

Backend papkasiga qayting:
```bash
cd /var/www/ikki-dost/BACKEND
npm install
```

**Prisma ma'lumotlar bazasini yuklash va yangilash:**
```bash
npx prisma generate
npx prisma migrate deploy
# Agar migration bo'lmasa, quyidagidan foydalaning: npx prisma db push
```

**Backendni qurish (build):**
```bash
npm run build
```

**PM2 orqali Backendni fonda yurgizish:**
```bash
pm2 start dist/main.js --name "ikki-dost-api"
pm2 save
pm2 startup
```

---

## 7. Nginx Serverini sozlash (Domen ulash)

Loyihada yaratgan `nginx-production.conf` faylimizni Nginx ga nusxalaymiz:
```bash
cd /var/www/ikki-dost
sudo cp nginx-production.conf /etc/nginx/sites-available/ikki-dost
```

Fayl ichidagi sozlamalarni domen nomiga moslang:
```bash
sudo nano /etc/nginx/sites-available/ikki-dost
```
> **Diqqat!** `server_name yourdomain.com;` qatorini o'z server IP manzilingizga (masalan: `server_name 192.168.1.1;`) yoki haqiqiy domeningizga o'zgartiring. Agar loyihani papkasini `/var/www/ikki-dost` deb belgilagan bo'lsangiz fayldagi yo'llar to'g'ri turibdi.

**Nginx ni yoqish va ishga tushirish:**
```bash
sudo ln -s /etc/nginx/sites-available/ikki-dost /etc/nginx/sites-enabled/
# Default nginx sozlamasini o'chiramiz (xalaqit bermasligi uchun)
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t  # "syntax is ok" yozuvi chiqishini tekshiring
sudo systemctl restart nginx
```

---

## 8. Xavfsizlik (SSL/HTTPS o'rnatish) *Ixtiyoriy ammo tavsiya etiladi*

Agar domeningiz bo'lsa va unga ulagan bo'lsangiz, tekin SSL sertifikatini (Let's Encrypt) o'rnating:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### 🎉 Tabriklaymiz!
Endi siz brauzer orqali IP manzilingizga (yoki domen nomiga) kirsangiz, **Ikki Dost** loyihasi to'liq ishlayotganini ko'rishingiz mumkin. Admin paneliga kishish uchun `/admin` manziliga o'tasiz.
