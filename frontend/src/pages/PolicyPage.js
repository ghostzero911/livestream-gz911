import React from 'react';
import { Helmet } from 'react-helmet-async';


function PolicyPage() {
    return (
        <>
            <Helmet>
                <title>Kebijakan Privasi - TV Bolaku</title>
                <meta
                    name="description"
                    content="Kebijakan pengumpulan data di situs TV Bolaku."
                />
            </Helmet>
            <div class="page-container">
                <h1>Privacy Policy</h1>
                <p><strong>Last Updated:</strong> 18 November 2025</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        At TV Bolaku, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information when you visit our website.
                        By using TV Bolaku, you agree to the terms outlined in this policy.
                    </p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>
                    <ul>
                        <li>
                            <strong>Log Data:</strong> Like most websites, our servers automatically record information such as your IP address, browser type,
                            referring/exit pages, and operating system. This helps us analyze traffic and improve server performance.
                        </li>
                        <li>
                            <strong>Cookies:</strong> We use cookies to store your preferences (like timezone settings) and to facilitate a smooth user experience.
                            You can disable cookies in your browser settings, though some site features may not function properly.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>3. Third-Party Services</h2>
                    <ul>
                        <li>
                            <strong>Advertising:</strong> We may use third-party advertising companies to serve ads when you visit our website.
                            These companies may use cookies to provide advertisements about goods and services of interest to you.
                        </li>
                        <li>
                            <strong>Analytics:</strong> We use analytics tools (e.g., Google Analytics) to understand how our audience uses the site.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>4. External Links</h2>
                    <p>
                        Our website contains links to external sites (such as stream providers) that are not operated by us.
                        We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                    </p>
                </section>

                <section>
                    <h2>5. Security</h2>
                    <p>
                        We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it.
                        But remember that no method of transmission over the internet is 100% secure and reliable, and we cannot guarantee its absolute security.
                    </p>
                </section>

                <section>
                    <h2>6. Changes to This Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We advise you to review this page periodically for any changes.
                    </p>
                </section>
            </div>
        </>
    )
}

export default PolicyPage;