import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, TouchableOpacity, ScrollView, TextInput, FlatList, Alert } from "react-native";
import { questions as defaultQuestions } from "./questions";

export default function App() {
	const normalize = (raw) => {
		return raw.map((q) => {
			if (Array.isArray(q.choices)) return q;
			if (typeof q.choices === "object") {
				const keys = Object.keys(q.choices);
				const arr = keys.map((k) => q.choices[k]);
				let ansIdx = 0;
				if (Array.isArray(q.answer)) {
					ansIdx = keys.indexOf(q.answer[0]);
				} else if (typeof q.answer === "string") {
					ansIdx = keys.indexOf(q.answer);
				}
				return { ...q, choices: arr, answer: ansIdx };
			}
			return q;
		});
	};

	const [activeTab, setActiveTab] = useState("preview"); // preview | settings
	const [stage, setStage] = useState("home"); // home | quiz | results
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userAnswers, setUserAnswers] = useState([]);
	const [highestScore, setHighestScore] = useState(0);
	const [quizQuestions, setQuizQuestions] = useState(normalize(defaultQuestions));
	const [timerSeconds, setTimerSeconds] = useState(60);
	const [timeLeft, setTimeLeft] = useState(0);
	const [quizActive, setQuizActive] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		if (global.localStorage) {
			const stored = parseInt(global.localStorage.getItem("highestScore") || "0", 10);
			setHighestScore(stored);
		}
	}, []);

	useEffect(() => {
		if (!quizActive || timeLeft <= 0) return;
		const t = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setQuizActive(false);
					completeQuiz();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(t);
	}, [quizActive, timeLeft]);

	const startQuiz = () => {
		setUserAnswers([]);
		setCurrentQuestionIndex(0);
		setStage("quiz");
		setTimeLeft(timerSeconds);
		setQuizActive(true);
	};

	const handleAnswer = (index) => {
		const newAnswers = [...userAnswers];
		newAnswers[currentQuestionIndex] = index;
		setUserAnswers(newAnswers);
	};

	const nextQuestion = () => {
		if (currentQuestionIndex < quizQuestions.length - 1) {
			setCurrentQuestionIndex((i) => i + 1);
		} else {
			completeQuiz();
		}
	};

	const prevQuestion = () => {
		if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
	};

	const calculateScore = () => {
		let score = 0;
		for (let i = 0; i < quizQuestions.length; i++) {
			if (userAnswers[i] === quizQuestions[i].answer) score++;
		}
		return score;
	};

	const completeQuiz = () => {
		setQuizActive(false);
		const score = calculateScore();
		if (score > highestScore) {
			setHighestScore(score);
			if (global.localStorage) global.localStorage.setItem("highestScore", score);
		}
		setStage("results");
	};

	const retry = () => startQuiz();

	const addQuestion = (q) => setQuizQuestions((prev) => [...prev, q]);
	const updateQuestion = (i, q) => setQuizQuestions((prev) => prev.map((item, idx) => (idx === i ? q : item)));
	const deleteQuestion = (i) => setQuizQuestions((prev) => prev.filter((_, idx) => idx !== i));

	return (
		<View style={[styles.container, { backgroundColor: isDarkMode ? "#111" : "#fff" }]}>
			{/* Tab Navigation */}
			<View style={styles.tabContainer}>
				<TouchableOpacity style={[styles.tab, activeTab === "preview" && styles.activeTab]} onPress={() => setActiveTab("preview")}>
					<Text style={[styles.tabText, { color: isDarkMode ? "#fff" : "#333" }]}>Preview Quiz</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.tab, activeTab === "settings" && styles.activeTab]} onPress={() => setActiveTab("settings")}>
					<Text style={[styles.tabText, { color: isDarkMode ? "#fff" : "#333" }]}>Quiz Settings</Text>
				</TouchableOpacity>
			</View>

			{/* Preview Quiz Tab */}
			{activeTab === "preview" && (
				<View style={styles.tabContent}>
					{stage === "home" && <Home onStart={startQuiz} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
					{stage === "quiz" && (
						<Quiz
							isDarkMode={isDarkMode}
							question={quizQuestions[currentQuestionIndex]}
							questionNumber={currentQuestionIndex + 1}
							total={quizQuestions.length}
							selected={userAnswers[currentQuestionIndex]}
							onSelect={handleAnswer}
							onNext={nextQuestion}
							onPrev={prevQuestion}
							timeLeft={timeLeft}
						/>
					)}
					{stage === "results" && (
						<Results isDarkMode={isDarkMode} score={calculateScore()} total={quizQuestions.length} highest={highestScore} onRetry={retry} />
					)}
				</View>
			)}

			{/* Quiz Settings Tab */}
			{activeTab === "settings" && (
				<QuizSettings
					isDarkMode={isDarkMode}
					quizQuestions={quizQuestions}
					timerSeconds={timerSeconds}
					setTimerSeconds={setTimerSeconds}
					addQuestion={addQuestion}
					updateQuestion={updateQuestion}
					deleteQuestion={deleteQuestion}
				/>
			)}
		</View>
	);
}

function Home({ onStart, isDarkMode, setIsDarkMode }) {
	return (
		<View style={styles.homeContainer}>
			<Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>Welcome to the Quiz</Text>
			<Text style={[styles.timerDisplay, { color: isDarkMode ? "#fff" : "#333" }]}>Timer: 60 seconds</Text>
			<View style={styles.buttonRow}>
				<Button title={isDarkMode ? "Light Mode" : "Dark Mode"} onPress={() => setIsDarkMode((v) => !v)} />
				<Button title="Start Quiz" onPress={onStart} />
			</View>
		</View>
	);
}

function Quiz({ isDarkMode, question, questionNumber, total, selected, onSelect, onNext, onPrev, timeLeft }) {
	return (
		<View style={styles.screen}>
			<Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>
				Question {questionNumber} of {total}
			</Text>
			<Text style={[styles.timerDisplay, { color: timeLeft <= 10 ? "#ff4444" : isDarkMode ? "#fff" : "#333" }]}>Time left: {timeLeft}s</Text>
			<Text style={[styles.question, { color: isDarkMode ? "#fff" : "#333" }]}>{question.question}</Text>
			<View style={styles.choices}>
				{question.choices.map((c, idx) => (
					<TouchableOpacity
						key={idx}
						style={[styles.choice, { borderColor: isDarkMode ? "#555" : "#ccc" }, selected === idx ? styles.choiceSelected : null]}
						onPress={() => onSelect(idx)}>
						<Text style={{ color: isDarkMode ? "#fff" : "#333" }}>{c}</Text>
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

function QuizSettings({ isDarkMode, quizQuestions, timerSeconds, setTimerSeconds, addQuestion, updateQuestion, deleteQuestion }) {
	const [temp, setTemp] = useState({ question: "", choices: ["", "", ""], answer: 0 });
	const [editingIndex, setEditingIndex] = useState(-1);

	const save = () => {
		if (editingIndex >= 0) {
			updateQuestion(editingIndex, temp);
			setEditingIndex(-1);
		} else {
			addQuestion(temp);
		}
		setTemp({ question: "", choices: ["", "", ""], answer: 0 });
	};

	const editQuestion = (item, index) => {
		setTemp({ ...item });
		setEditingIndex(index);
	};

	const cancelEdit = () => {
		setTemp({ question: "", choices: ["", "", ""], answer: 0 });
		setEditingIndex(-1);
	};

	return (
		<ScrollView contentContainerStyle={styles.settingsContainer}>
			<Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>Quiz Settings</Text>

			{/* Timer Settings */}
			<View style={styles.settings}>
				<Text style={[styles.subtitle, { color: isDarkMode ? "#fff" : "#333" }]}>Timer Settings</Text>
				<Text style={{ color: isDarkMode ? "#fff" : "#333" }}>Quiz Duration (seconds):</Text>
				<TextInput
					keyboardType="numeric"
					value={String(timerSeconds)}
					onChangeText={(t) => setTimerSeconds(parseInt(t) || 0)}
					style={[
						styles.input,
						{ backgroundColor: isDarkMode ? "#333" : "#fff", color: isDarkMode ? "#fff" : "#333", borderColor: isDarkMode ? "#555" : "#ccc" },
					]}
				/>
			</View>

			{/* Question List */}
			<View style={styles.settings}>
				<Text style={[styles.subtitle, { color: isDarkMode ? "#fff" : "#333" }]}>Questions ({quizQuestions.length})</Text>
				{quizQuestions.map((item, idx) => (
					<View key={idx} style={styles.questionRow}>
						<View style={{ flex: 1 }}>
							<Text style={{ color: isDarkMode ? "#fff" : "#333", fontWeight: "bold" }} numberOfLines={1}>
								{idx + 1}. {item.question}
							</Text>
							<Text style={{ color: isDarkMode ? "#aaa" : "#666", fontSize: 12 }} numberOfLines={1}>
								Answer: {item.choices[item.answer]}
							</Text>
						</View>
						<View style={styles.actionButtons}>
							<Button title="Edit" onPress={() => editQuestion(item, idx)} />
							<Button title="Delete" onPress={() => deleteQuestion(idx)} color="#ff4444" />
						</View>
					</View>
				))}
			</View>

			{/* Add/Edit Question Form */}
			<View style={styles.settings}>
				<Text style={[styles.subtitle, { color: isDarkMode ? "#fff" : "#333" }]}>
					{editingIndex >= 0 ? `Edit Question ${editingIndex + 1}` : "Add New Question"}
				</Text>
				<TextInput
					placeholder="Question"
					value={temp.question}
					onChangeText={(t) => setTemp({ ...temp, question: t })}
					style={[
						styles.input,
						{ backgroundColor: isDarkMode ? "#333" : "#fff", color: isDarkMode ? "#fff" : "#333", borderColor: isDarkMode ? "#555" : "#ccc" },
					]}
				/>
				{temp.choices.map((c, i) => (
					<TextInput
						key={i}
						placeholder={`Choice ${i + 1}`}
						value={c}
						onChangeText={(t) => setTemp({ ...temp, choices: temp.choices.map((v, j) => (j === i ? t : v)) })}
						style={[
							styles.input,
							{ backgroundColor: isDarkMode ? "#333" : "#fff", color: isDarkMode ? "#fff" : "#333", borderColor: isDarkMode ? "#555" : "#ccc" },
						]}
					/>
				))}
				<Text style={{ color: isDarkMode ? "#fff" : "#333" }}>Correct answer index (0-based):</Text>
				<TextInput
					keyboardType="numeric"
					value={String(temp.answer)}
					onChangeText={(t) => setTemp({ ...temp, answer: parseInt(t) || 0 })}
					style={[
						styles.input,
						{ backgroundColor: isDarkMode ? "#333" : "#fff", color: isDarkMode ? "#fff" : "#333", borderColor: isDarkMode ? "#555" : "#ccc" },
					]}
				/>
				<View style={styles.formButtons}>
					<Button title={editingIndex >= 0 ? "Update" : "Add Question"} onPress={save} />
					{editingIndex >= 0 && <Button title="Cancel" onPress={cancelEdit} color="#ff4444" />}
				</View>
			</View>
		</ScrollView>
	);
}

function Results({ isDarkMode, score, total, highest, onRetry }) {
	return (
		<View style={styles.screen}>
			<Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>Quiz Completed</Text>
			<Text style={{ color: isDarkMode ? "#fff" : "#333" }}>
				Your score: {score} / {total}
			</Text>
			<Text style={{ color: isDarkMode ? "#fff" : "#333" }}>
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
	tabContainer: {
		flexDirection: "row",
		width: "100%",
		marginBottom: 20,
		borderBottomWidth: 2,
		borderBottomColor: "#ccc",
	},
	tab: {
		flex: 1,
		padding: 15,
		alignItems: "center",
	},
	activeTab: {
		borderBottomWidth: 3,
		borderBottomColor: "#007bff",
	},
	tabText: {
		fontSize: 16,
		fontWeight: "bold",
	},
	tabContent: {
		flex: 1,
		width: "100%",
		alignItems: "center",
	},
	screen: {
		width: "100%",
		alignItems: "center",
	},
	homeContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
	},
	timerDisplay: {
		fontSize: 20,
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 20,
		marginVertical: 10,
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
	settingsContainer: {
		flex: 1,
		width: "100%",
		paddingBottom: 20,
	},
	settings: {
		width: "100%",
		padding: 15,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#999",
		borderRadius: 5,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "center",
		width: "100%",
		gap: 20,
	},
	input: {
		width: "100%",
		borderWidth: 1,
		borderColor: "#ccc",
		padding: 8,
		marginVertical: 5,
		borderRadius: 4,
	},
	questionRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginVertical: 8,
		paddingRight: 5,
	},
	actionButtons: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 5,
	},
	formButtons: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 10,
		marginTop: 10,
	},
});
