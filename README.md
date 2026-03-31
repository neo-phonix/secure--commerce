# SecureCommerce AI

A high-security, AI-powered e-commerce platform built with Next.js, Supabase, and Gemini AI.

## 🚀 Quick Start

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup environment variables**:
    ```bash
    npm run setup
    ```
    Then, open `.env.local` and fill in your credentials.
4.  **Database Setup**:
    -   Create a new Supabase project.
    -   Go to the **SQL Editor** in the Supabase dashboard.
    -   Copy the contents of `supabase-schema.sql` and run it.
5.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 🔐 Security Features

-   **Role-Based Access Control (RBAC)**: Standardized roles (`customer`, `admin`, `super_admin`) enforced at the middleware, API, and database levels.
-   **Data Encryption**: Sensitive data is encrypted using AES-256 CBC.
-   **Audit Logging**: Every critical action is logged in the `audit_logs` table for security auditing.
-   **Rate Limiting**: Protection against brute-force and DoS attacks on sensitive routes.
-   **Secure AI Integration**: Gemini AI calls are handled through secure backend API routes.

## 🛠️ Environment Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret). |
| `GEMINI_API_KEY` | Your Google Gemini AI API key. |
| `RAZORPAY_KEY_ID` | Your Razorpay API Key ID. |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API Key Secret. |
| `ENCRYPTION_KEY` | A 32-character string for data encryption. |

## 👥 User Roles

-   **Customer**: Can browse products, manage cart/wishlist, and place orders.
-   **Admin**: Can manage products, categories, and view orders.
-   **Super Admin**: Full access to the system, including audit logs and user management.

## 🤖 AI Assistant

The platform includes an AI-powered chatbot and recommendation system powered by **Gemini AI**. It helps users find products and answers questions about the platform.
