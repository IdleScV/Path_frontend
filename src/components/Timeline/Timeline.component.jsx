import React, { useState, useRef, useEffect } from 'react';
// Components
import Event from './Event/Event.component';
import ErrorPage from '../ErrorPage/ErrorPage.component';
import NewEventButton from '../Forms/NewEvent/NewEventButton';

// Hook
import { useResize } from '../../hooks/windowSize';
import { useFetch } from '../../hooks/useFetch';

// Auth
import { withAuthorization } from '../../authentication/Session';

// Styles
import { makeStyles } from '@material-ui/core/styles';
import { Button, Slider } from '@material-ui/core';
import './Timeline.style.css';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

//URL
import { URL } from '../../urlEnv/index';

// React Dom
import { useHistory } from 'react-router-dom';

// for inline styling
const useStyles = makeStyles((theme) => ({
	margin: {
		margin: theme.spacing(0.5)
	}
}));

function Timeline(props) {
	// current date
	let d = new Date();
	// React Router Hook
	const history = useHistory();
	// Fetch Hook
	const [ response, loading, hasError ] = useFetch(URL + 'timelines/' + props.match.params.id);

	// State
	let [ filters, filtersSet ] = useState([]);
	let [ ageRange, ageRangeSet ] = useState([ 0, null ]);
	let [ eventData, eventDataSet ] = useState(null);
	// Style Hook
	const inlineStyles = useStyles();

	// Window size Hook
	const componentRef = useRef();
	const { width } = useResize(componentRef, loading);

	// response filter
	if (loading) {
		return <div ref={componentRef}>Loading</div>;
	}
	if (hasError) {
		return <div ref={componentRef}>Has Error</div>;
	}

	if (response !== false && response !== null && response.status !== 404) {
		const { title, picture, person, events, user, status, id: timelineId, person_id, user_id } = response;
		const { username } = user;

		const { birthday, deathday } = person;

		// Button Color
		const buttonTypes = [
			{ name: 'Major', color: 'secondary' },
			{ name: 'Minor', color: 'secondary' },
			{ name: 'Personal', color: 'primary' },
			{ name: 'World', color: 'primary' },
			{ name: 'Country', color: 'primary' },
			{ name: 'City', color: 'primary' }
		];

		// Sort events + filter events
		const sortEvents = (event_data) => {
			let sorted = event_data.sort((a, b) => findYear(a.date) > findYear(b.date));
			return sorted.map((event, i) => ({ ...event, sortedOrder: i }));
		};
		const processFilterClick = (e) => {
			let value = e.currentTarget.name;
			if (value === 'Major' && filters.includes('Minor')) {
				filtersSet(filters.filter((item) => item !== 'Minor').concat(value));
			} else if (value === 'Minor' && filters.includes('Major')) {
				filtersSet(filters.filter((item) => item !== 'Major').concat(value));
			} else if (filters.includes(value)) {
				filtersSet(filters.filter((item) => item !== value));
			} else {
				filtersSet(filters.concat(value));
			}
		};
		const filterEventsByCategory = (event_data) => {
			let arr = event_data;
			for (let i = 0; i < filters.length; i++) {
				arr = arr.filter((event) => ![ event.instance_type, event.scale ].includes(filters[i]));
			}
			return arr;
		};

		// Converts date data to just year
		const findYear = (num_string) => {
			return num_string.split('-')[0];
		};

		const currentAge = (event) => {
			return findYear(event.date) - findYear(birthday);
		};
		const filterEventsByAge = (event_data) => {
			if (ageRange[1]) {
				return event_data.filter((event) => currentAge(event) >= ageRange[0] && currentAge(event) <= ageRange[1]);
			} else {
				return event_data;
			}
		};

		const handleSlider = (e, newValue) => {
			// Set min difference to 10
			if (newValue[1] - newValue[0] >= 10 && newValue !== ageRange) {
				ageRangeSet(newValue);
			}
		};
		const deathAge = () => {
			return findYear(deathday) - findYear(birthday);
		};

		const currentAgeToDate = () => {
			return d.getFullYear() - findYear(birthday);
		};
		const roundUpTen = (num) => {
			return Math.ceil((num + 1) / 10) * 10;
		};

		// Line-Marker
		const lineMarkers = () => {
			let distance = '';
			ageRange[1]
				? (distance = ageRange[1] - ageRange[0])
				: deathday ? (distance = deathAge() - ageRange[0]) : (distance = currentAgeToDate() - ageRange[0]);

			let eqDistance = distance / 10;
			let arr = [];
			for (let i = 1; i < 10; i++) {
				arr.push(Math.floor(eqDistance * i));
			}

			let currentRange = ageRange[1] - ageRange[0];
			return arr.map((num) => (num + parseInt(findYear(birthday)) + ageRange[0]).toString());
		};

		return (
			<div className="timeline-component" ref={componentRef}>
				<div className="header">
					<Button color="primary" onClick={() => history.goBack()}>
						<ArrowBackIcon />
					</Button>

					<h3 className="title">{title}</h3>
					<div className="header-item">
						<NewEventButton
							maker_id={user.firebase_id}
							firebase_id={props.firebase.auth.W}
							events={events}
							eventData={eventData}
							eventDataSet={eventDataSet}
							timelineId={timelineId}
						/>
					</div>
				</div>
				<div className="filters">
					{buttonTypes.map((button, i) => (
						<Button
							className={`${button.name} ${inlineStyles.margin}`}
							name={button.name}
							color={button.color}
							size="small"
							variant={filters.includes(button.name) ? 'outlined' : 'contained'}
							onClick={processFilterClick}
							key={i}
						>
							{button.name}
						</Button>
					))}

					<Slider
						defaultValue={[ 0, deathday ? deathAge() : currentAgeToDate() ]}
						value={ageRange[1] ? ageRange : deathday ? [ 0, deathAge() ] : [ 0, currentAgeToDate() ]}
						onChange={handleSlider}
						aria-labelledby="range-slider"
						step={1}
						min={0}
						max={deathday ? deathAge() : currentAgeToDate()}
						valueLabelDisplay="auto"
					/>
				</div>
				<div className="timeline-box">
					<div className="birth year">{parseInt(findYear(birthday)) + ageRange[0]}</div>

					<div className="events">
						<div className="timeline-line">
							{lineMarkers().map((marker, i) => <div className="timeline-markers" key={i}>{`${marker}`}</div>)}
						</div>
						<div className="event-container">
							{filterEventsByAge(
								filterEventsByCategory(sortEvents(eventData ? eventData : events))
							).map((event, i) => (
								// {filterEventsByAge(sortEvents(events)).map((event, i) => (
								<Event
									event_data={event}
									key={i}
									index={i}
									currentAge={findYear(event.date) - findYear(birthday)}
									birthyear={findYear(birthday)}
									ageRange={ageRange[1] ? ageRange : deathday ? [ 0, deathAge() ] : [ 0, currentAgeToDate() ]}
									xAdjustment={width - 690}
									filters={filters}
								/>
							))}
						</div>
					</div>

					<div className="death year">
						{parseInt(findYear(birthday)) +
							(ageRange[1] ? ageRange[1] : deathday ? deathAge() : currentAgeToDate())}
					</div>
				</div>
			</div>
		);
	} else {
		return <ErrorPage response={response} />;
	}
}

// export default Timeline;

const authCondition = (authUser) => !!authUser;

export default withAuthorization(authCondition)(Timeline);
