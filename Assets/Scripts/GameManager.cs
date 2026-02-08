using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    private int score = 0;
    private bool isGameActive = false;
    private int gameOverCount = 0;
    private bool hasRevived = false;

    [Header("References")]
    public UIManager uiManager;
    public GameObject player;

    [Header("AdMob Placeholder IDs (Test Only)")]
    private string bannerId = "ca-app-pub-3940256099942544/6300978111";
    private string interstitialId = "ca-app-pub-3940256099942544/1033173712";
    private string rewardedId = "ca-app-pub-3940256099942544/5224354917";

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    void Start()
    {
        if (player == null) player = GameObject.FindWithTag("Player");
        ShowBanner();
    }

    public void StartGame()
    {
        score = 0;
        isGameActive = true;
        hasRevived = false;
        if (uiManager != null)
        {
            uiManager.UpdateScore(score);
            uiManager.ShowGameUI();
        }
        HideBanner();
    }

    public void AddScore(int points)
    {
        if (!isGameActive) return;
        score += points;
        if (uiManager != null) uiManager.UpdateScore(score);
    }

    public void GameOver()
    {
        isGameActive = false;
        gameOverCount++;
        if (uiManager != null) uiManager.ShowGameOver(score, !hasRevived);

        ShowBanner();

        if (gameOverCount % 2 == 0)
        {
            ShowInterstitial();
        }
    }

    public void Revive()
    {
        ShowRewardedAd(() => {
            hasRevived = true;
            isGameActive = true;
            if (uiManager != null) uiManager.ShowGameUI();
            HideBanner();

            // Reposition player to center
            if (player != null)
            {
                player.transform.position = Vector3.zero;
                Rigidbody2D rb = player.GetComponent<Rigidbody2D>();
                if (rb != null)
                {
                    rb.velocity = Vector2.zero;
                    rb.angularVelocity = 0;
                }
            }
            Debug.Log("Player Revived and Repositioned!");
        });
    }

    public void RestartGame()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    public bool IsGameActive() => isGameActive;

    #region AdMob Placeholders
    private void ShowBanner()
    {
        Debug.Log($"[AdMob] Showing Banner Ad: {bannerId}");
    }

    private void HideBanner()
    {
        Debug.Log("[AdMob] Hiding Banner Ad");
    }

    private void ShowInterstitial()
    {
        Debug.Log($"[AdMob] Showing Interstitial Ad: {interstitialId}");
    }

    private void ShowRewardedAd(System.Action onComplete)
    {
        Debug.Log($"[AdMob] Showing Rewarded Ad: {rewardedId}");
        onComplete?.Invoke();
    }
    #endregion
}
