import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, TouchableOpacity } from "react-native";
import { questions } from "./questions";

export default function App() {
	const [stage, setStage] = useState("home");
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState([]);
	const [highestScore, setHighestScore] = useState(0);

	useEffect(() => {
		// load highest score from async storage if needed (using React Native AsyncStorage)
		// for simplicity using global storage compatibility via localStorage polyfill
		if (global.localStorage) {
			const stored = parseInt(global.localStorage.getItem("highestScore") || "0", 10);
			setHighestScore(stored);
		}
	}, []);

	const questionsCount = questions.length;

	const startQuiz = () => {
		setUserAnswers([]);
		setCurrentQuestionIndex(0);
		setStage("quiz");
	};

	const handleAnswer = (index) => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = index;
		setUserAnswers(newAnswers);
	};

	const nextQuestion = () => {
		if (currentQuestionIndex < questionsCount - 1) {
			setCurrentQuestionIndex((i) => i + 1);
		} else {
			completeQuiz();
		}
	};

	const prevQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((i) => i - 1);
		}
	};

	const calculateScore = () => {
		let score = 0;
		for (let i = 0; i < questionsCount; i++) {
			if (userAnswers[i] === questions[i].answer) score++;
		}
		return score;
	};

	const completeQuiz = () => {
		const score = calculateScore();
		if (score > highestScore) {
			setHighestScore(score);
			if (global.localStorage) {
				global.localStorage.setItem("highestScore", score);
			}
		}
		setStage("results");
	};

	const retry = () => {
		startQuiz();
	};

	return (
		<View style={styles.container}>
			{stage === "home" && <Home onStart={startQuiz} />}
			{stage === "quiz" && (
				<Quiz
					question={questions[currentQuestionIndex]}
					questionNumber={currentQuestionIndex + 1}
					total={questionsCount}
					selected={userAnswers[currentQuestionIndex]}
					onSelect={handleAnswer}
					onNext={nextQuestion}
					onPrev={prevQuestion}
				/>
			)}
			{stage === "results" && <Results score={calculateScore()} total={questionsCount} highest={highestScore} onRetry={retry} />}
		</View>
	);
}

function Home({ onStart }) {
	return (
		<View style={styles.screen}>
			<Text style={styles.title}>Welcome to the Quiz</Text>
			<Button title="Start Quiz" onPress={onStart} />
		</View>
	);
}

function Quiz({ question, questionNumber, total, selected, onSelect, onNext, onPrev }) {
	return (
		<View style={styles.screen}>
			<Text style={styles.title}>
				Question {questionNumber} of {total}
			</Text>
			<Text style={styles.question}>{question.question}</Text>
			<View style={styles.choices}>
				{question.choices.map((c, idx) => (
					<TouchableOpacity key={idx} style={[styles.choice, selected === idx ? styles.choiceSelected : null]} onPress={() => onSelect(idx)}>
						<Text>{c}</Text>
					</TouchableOpacity>
				))}
			</View>
			<View style={styles.navigation}>
				<Button title="Previous" onPress={onPrev} disabled={questionNumber === 1} />
				<Button title={questionNumber === total ? "Submit" : "Next"} onPress={onNext} />
			</View>
		</View>
	);
}

function Results({ score, total, highest, onRetry }) {
	return (
		<View style={styles.screen}>
			<Text style={styles.title}>Quiz Completed</Text>
			<Text>
				Your score: {score} / {total}
			</Text>
			<Text>
				Highest score: {highest} / {total}
			</Text>
			<Button title="Try Again" onPress={onRetry} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	screen: {
		width: "100%",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
	},
	question: {
		fontSize: 18,
		marginVertical: 10,
		textAlign: "center",
	},
	choices: {
		width: "100%",
	},
	choice: {
		padding: 10,
		marginVertical: 5,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
	},
	choiceSelected: {
		backgroundColor: "#ddd",
	},
	navigation: {
		flexDirection: "row",
		marginTop: 20,
		justifyContent: "space-between",
		width: "100%",
	},
});
