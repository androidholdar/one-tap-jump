using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    [Header("UI Panels")]
    public GameObject mainMenuPanel;
    public GameObject gameHUDPanel;
    public GameObject gameOverPanel;

    [Header("Text Elements")]
    public Text scoreText;
    public Text finalScoreText;

    [Header("Buttons")]
    public Button reviveButton;

    public void ShowGameUI()
    {
        if (mainMenuPanel) mainMenuPanel.SetActive(false);
        if (gameHUDPanel) gameHUDPanel.SetActive(true);
        if (gameOverPanel) gameOverPanel.SetActive(false);
    }

    public void ShowGameOver(int finalScore, bool canRevive)
    {
        if (mainMenuPanel) mainMenuPanel.SetActive(false);
        if (gameHUDPanel) gameHUDPanel.SetActive(false);
        if (gameOverPanel) gameOverPanel.SetActive(true);

        if (finalScoreText) finalScoreText.text = "Score: " + finalScore;
        if (reviveButton) reviveButton.gameObject.SetActive(canRevive);
    }

    public void UpdateScore(int currentScore)
    {
        if (scoreText) scoreText.text = currentScore.ToString();
    }

    public void OnStartButtonPressed()
    {
        if (GameManager.Instance != null) GameManager.Instance.StartGame();
    }

    public void OnReviveButtonPressed()
    {
        if (GameManager.Instance != null) GameManager.Instance.Revive();
    }

    public void OnRestartButtonPressed()
    {
        if (GameManager.Instance != null) GameManager.Instance.RestartGame();
    }
}
