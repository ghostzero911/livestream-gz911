import React from 'react';
import { Helmet } from 'react-helmet-async';


function DisclaimerPage() {
    return (
        <>
            <Helmet>
                <title>Sanggahan/Disklaimer - TV Bolaku</title>
                <meta
                    name="description"
                    content="Sanggahan dan disklaim atas informasi dan konten yang tersedia di situs TV Bolaku."
                />
            </Helmet>
            <div class="page-container">
                <h1>Disclaimer & DMCA</h1>

                <section>
                    <h2>1. General Disclaimer</h2>
                    <p>
                        The information provided by TV Bolaku ("we," "us," or "our") on this website is for general informational and entertainment purposes only.
                        All information on the Site is provided in good faith, however, we make no representation or warranty of any kind regarding the accuracy,
                        adequacy, validity, reliability, availability, or completeness of any information on the Site.
                    </p>
                </section>

                <section>
                    <h2>2. Copyright & DMCA Notice</h2>
                    <p><strong>TV Bolaku DOES NOT host, upload, or control any video content.</strong></p>
                    <p>
                        All streams, videos, and content found on this site are embedded from third-party sites (such as <code>strmd.top</code>, <code>doodstream</code>, etc.)
                        that are freely available on the internet. We are merely a search engine and aggregator for these links.
                    </p>
                    <p>
                        We are not responsible for the content of external websites. If you find any content that infringes upon your copyright,
                        please contact the hosting organization responsible for the content (the third-party server) directly to have it removed.
                    </p>
                </section>

                <section>
                    <h2>3. External Links Disclaimer</h2>
                    <p>
                        The Site may contain links to other websites or content belonging to or originating from third parties.
                        Such external links are not investigated, monitored, or checked for accuracy, validity, reliability, availability, or completeness by us.
                    </p>
                    <ul>
                        <li>We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site.</li>
                        <li>We will not be a party to or in any way be responsible for monitoring any transaction between you and third-party providers of products or services.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. "Use at Your Own Risk"</h2>
                    <p>
                        Streaming content from third-party sources may involve pop-up advertisements or redirects over which we have no control.
                        Users are advised to use ad-blockers and adequate antivirus protection. TV Bolaku is not liable for any damages arising from the use of third-party links.
                    </p>
                </section>
            </div>
        </>
    )
}

export default DisclaimerPage;