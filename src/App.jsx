
import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { MatchCard } from './components/MatchCard'
import { supabase } from './supabase'
import './App.css'

function App() {
    const [totalBookings, setTotalBookings] = useState(0);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchMatches() {
            const { data, error } = await supabase
                .from('matches')
                .select('*');

            if (error) {
                setError(error.message);
            } else {
                const formattedMatches = data.map(match => ({
                    ...match,
                    availableSeats: match.available_seats
                }));

                setMatches(formattedMatches);
            }

            setLoading(false);
        }

        fetchMatches();
    }, []);

    // Realtime subscription for match updates
    useEffect(() => {
        const channel = supabase
            .channel('matches-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches'
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedMatch = payload.new;

                        setMatches(prevMatches =>
                            prevMatches.map(match =>
                                match.id === updatedMatch.id
                                    ? {
                                        ...updatedMatch,
                                        availableSeats: updatedMatch.available_seats
                                    }
                                    : match
                            )
                        );
                    }

                    if (payload.eventType === 'INSERT') {
                        const newMatch = payload.new;

                        setMatches(prevMatches => [
                            ...prevMatches,
                            {
                                ...newMatch,
                                availableSeats: newMatch.available_seats
                            }
                        ]);
                    }

                    if (payload.eventType === 'DELETE') {
                        setMatches(prevMatches =>
                            prevMatches.filter(
                                match => match.id !== payload.old.id
                            )
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    async function handleSelectMatch(selectedMatch) {
        const userName = prompt('Enter your name:');

        if (!userName || !userName.trim()) {
            alert('Please enter your name.');
            return;
        }

        const ticketInput = prompt('Enter the number of tickets:');

        if (ticketInput === null) return;

        const tickets = Number(ticketInput);

        if (!Number.isInteger(tickets) || tickets <= 0) {
            alert('Please enter a valid number of tickets.');
            return;
        }

        if (tickets > selectedMatch.availableSeats) {
            alert('Not enough seats available!');
            return;
        }

        const totalPrice = tickets * selectedMatch.price;
        const remainingSeats = selectedMatch.availableSeats - tickets;

        // Update available seats in Supabase
        const { data: updatedMatch, error: updateError } = await supabase
            .from('matches')
            .update({ available_seats: remainingSeats })
            .eq('id', selectedMatch.id)
            .eq('available_seats', selectedMatch.availableSeats)
            .select()
            .maybeSingle();

        if (updateError) {
            alert('Could not update seats: ' + updateError.message);
            return;
        }

        if (!updatedMatch) {
            alert('Seats have changed. Please refresh and try again.');
            return;
        }

        // Insert booking into Supabase
        const { error: bookingError } = await supabase
            .from('bookings')
            .insert({
                match_id: selectedMatch.id,
                user_name: userName.trim(),
                match_title: `${selectedMatch.team1} vs ${selectedMatch.team2}`,
                tickets: tickets,
                total_price: totalPrice
            });

        if (bookingError) {
            // Restore seats if booking insertion fails
            await supabase
                .from('matches')
                .update({ available_seats: selectedMatch.availableSeats })
                .eq('id', selectedMatch.id);

            alert('Booking failed: ' + bookingError.message);
            return;
        }

        // Update the website
        setMatches(prevMatches =>
            prevMatches.map(match =>
                match.id === selectedMatch.id
                    ? { ...match, availableSeats: remainingSeats }
                    : match
            )
        );

        setTotalBookings(prevCount => prevCount + 1);

        alert(
            `Booking successful!\nMatch: ${selectedMatch.team1} vs ${selectedMatch.team2}\nTickets: ${tickets}\nTotal: ₹${totalPrice}`
        );
    }

    return (
        <>
            <Navbar totalBookings={totalBookings} />

            <Hero />

            <section>
                <h2>Upcoming Matches</h2>

                {loading && <p>Loading matches...</p>}

                {error && <p>Error: {error}</p>}

                {!loading && !error && matches.map((match) => (
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
