import React from 'react';
import { Helmet } from 'react-helmet-async';


function AboutPage() {
    return (
        <>
            <Helmet>
                <title>Tentang Kami - TV Bolaku</title>
                <meta
                    name="description"
                    content="Semua tentang TV Bolaku - Misi kami, Layanan kami, Kontak kami."
                />
            </Helmet>

            <div class="page-container">
                <h1>About TV Bolaku</h1>

                <h3>The Beautiful Game, Anywhere, Anytime.</h3>

                <section>
                    <p>
                        Welcome to <strong>TV Bolaku</strong>, your premier destination for live soccer streaming and real-time scores.
                        We were born out of a simple passion: the love of football. We believe that every fan, no matter where they are
                        in the world, deserves a front-row seat to the action.
                    </p>
                </section>

                <section>
                    <h2>Our Mission</h2>
                    <p>
                        Our mission is to remove the barriers between you and your favorite team. Whether it's a high-stakes Champions League night,
                        a local league derby, or an international friendly, TV Bolaku strives to provide reliable, high-quality, and accessible streams for everyone.
                    </p>
                </section>

                <section>
                    <h2>What We Offer</h2>
                    <ul>
                        <li><strong>Comprehensive Coverage:</strong> From the English Premier League and La Liga to Serie A and the Bundesliga, we cover the leagues that matter to you.</li>
                        <li><strong>Real-Time Data:</strong> Live scores, match stats, and schedules updated to the second.</li>
                        <li><strong>User-Centric Design:</strong> A clean, fast, and responsive interface that works perfectly on your desktop or mobile device.</li>
                    </ul>
                </section>

                <section>
                    <h2>Why Choose Us?</h2>
                    <p>
                        We understand the frustration of broken links and laggy streams. Our platform is built with modern technology to ensure
                        stability and speed, keeping you connected to the pitch without interruption.
                    </p>
                </section>

                <section>
                    <h2>Contact Us</h2>
                    <p>
                        Have a suggestion or found a bug? We'd love to hear from you. Reach out to our support team at <a href="mailto:support@tvbolaku.online">support@tvbolaku.online</a>.
                    </p>
                </section>
            </div>
        </>
    )
}

export default AboutPage;