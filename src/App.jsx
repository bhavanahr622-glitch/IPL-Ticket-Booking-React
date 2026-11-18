
import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { MatchCard } from './components/MatchCard'
import './App.css'

function App() {

    // State to track total bookings
    const [totalBookings, setTotalBookings] = useState(0);

    // IPL match details
    const matches = [
        {
            id: 1,
            team1: 'CSK',
            team2: 'MI',
            date: '20 November 2026',
            venue: 'Chennai',
            price: 1500,
            availableSeats: 50
        },
        {
            id: 2,
            team1: 'RCB',
            team2: 'KKR',
            date: '22 November 2026',
            venue: 'Bengaluru',
            price: 1200,
            availableSeats: 0
        },
        {
            id: 3,
            team1: 'SRH',
            team2: 'RR',
            date: '25 November 2026',
            venue: 'Hyderabad',
            price: 1000,
            availableSeats: 30
        }
    ];

    // Function to handle match selection
    function handleSelectMatch(selectedMatch) {
        setTotalBookings(prevCount => prevCount + 1);

        alert(`${selectedMatch.team1} vs ${selectedMatch.team2} selected!`);
    }

    return (
        <>
            <Navbar totalBookings={totalBookings} />

            <Hero />

            <section>
                <h2>Upcoming Matches</h2>

                {matches.map((match) => (
                    <MatchCard
                        key={match.id}
                        match={match}
                        onSelectMatch={handleSelectMatch}
                    />
                ))}
            </section>
        </>
    )
}

export default App
