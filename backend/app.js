const express = require("express")
const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const dbPath = path.join(__dirname, "twitterClone.db")
let db = null

const app = express()
app.use(express.json())

const initializeDbandServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(3000, () => {
            console.log("server is up on http://localhost:3000")
        })

    }
    catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}

initializeDbandServer()


# log in route
# smart registraion route
# report history 
# Data editing

app.post("/register", async (request, response) => {
    const { username, password, name, gender } = request.body
    const verifyUsername = await db.get(`select * from user where username = "${username}"`)

    if (verifyUsername !== undefined) {
        response.status(400)
        response.send("User already exists")
    }
    else if (password.length <= 6) {
        response.status(400)
        response.send("Password is too short")
    }
    else {
        let hashedPassword = await bcrypt.hash(password, 10)

        await db.run(`insert into user (name, username, password, gender) 
        values ("${name}","${username}","${hashedPassword}","${gender}");`)

        response.send("User created successfully")
    }
})

app.post("/login", async (request, response) => {
    const { username, password } = request.body
    const verifyUsername = await db.get(`select * from user where username = "${username}"`)
    let verifyPassword

    if (verifyUsername === undefined) {
        response.status(400)
        response.send("Invalid user")
    }
    else {
        verifyPassword = await bcrypt.compare(password, verifyUsername.password)

        if (!verifyPassword) {
            response.status(400)
            response.send("Invalid password")
        }
        else {
            const payload = {
                username: username
            }
            const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN")
            response.send({
                jwtToken: jwtToken
            })
        }
    }
})

const authenticateToken = (request, response, next) => {
    let jwtToken
    const authHeader = request.headers["authorization"]
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1]
    }

    if (jwtToken === undefined) {
        response.status(401)
        response.send("Invalid JWT Token")
    } else {
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if (error) {
                response.status(401)
                response.send("Invalid JWT Token")
                console.log(error)
            } else {
                request.username = payload.username
                next()
            }
        })
    }
}

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
    let { username } = request;
    const getUserFeedQuery = `
        SELECT
            user.username,
            tweet.tweet,
            tweet.date_time as dateTime
        FROM
            tweet
            JOIN follower ON tweet.user_id = follower.follower_user_id
            JOIN user ON user.user_id = tweet.user_id
        WHERE
            follower.following_user_id in (
                SELECT
                    user_id
                FROM
                    user
                WHERE
                    username = "${username}"
        )
        ORDER BY tweet.date_time DESC LIMIT 4;`

    const getuserFeed = await db.all(getUserFeedQuery)
    response.send(getuserFeed)
})

app.get("/user/following", authenticateToken, async (request, response) => {
    const { username } = request;
    const getFollowersQuery = `
    SELECT
        user.name
    FROM
        user
        INNER JOIN follower 
        ON user.user_id = follower.follower_user_id
    WHERE
        follower.following_user_id in (
            SELECT
                user_id
            FROM
                user
            WHERE
                username = "${username}"
    );
    `

    const getFollowers = await db.all(getFollowersQuery)

    response.send(getFollowers)
})

app.get("/user/followers", authenticateToken, async (request, response) => {
    const { username } = request;
    const getFollowersQuery = `
    SELECT
        user.name
    FROM
        user
        JOIN follower 
        ON user.user_id = follower.follower_user_id
    WHERE
        follower.following_user_id = (
            SELECT
                user_id
            FROM
                user
            WHERE
                username = "${username}"
    );
    `

    const getFollowers = await db.all(getFollowersQuery)

    response.send(getFollowers)
})

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params
    const validateUserIdwithTweet = await db.get(`select user.username from user join tweet on user.user_id = tweet.user_id where tweet.tweet_id = ${tweetId}`)

    if (validateUserIdwithTweet.username !== username) {
        response.status(401)
        response.send("Invalid Request")
    }
    else {
        const getTweet = await db.get(`
            SELECT
                tweet.tweet,
                COUNT(LIKE.like_id) AS likes,
                COUNT(reply.reply_id) AS replies,
                tweet.date_time AS DATETIME
            FROM
                tweet
                JOIN reply ON tweet.tweet_id = reply.tweet_id
                join like on tweet.tweet_id = like.tweet_id
            where 
                tweet.tweet_id = ${tweetId}
            group by tweet.tweet_id
        `)
        response.send(getTweet)
    }
})

app.get("/tweets/:tweetId/likes", authenticateToken, async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params
    const validateTweetfollowing = await db.get(`
    SELECT DISTINCT
        user.username
    FROM
        follower
        JOIN user ON follower.following_user_id = user.user_id
        JOIN tweet ON follower.following_user_id = tweet.user_id
    WHERE
        follower.follower_user_id = (
            SELECT
                user_id
            FROM
                user
            WHERE
                user.username = "${username}"
        )
        AND tweet.tweet_id = ${tweetId};
    `)

    if (validateTweetfollowing === undefined) {
        response.status(401)
        response.send("Invalid Request")
    } else {
        const getlikers = await db.all(`SELECT
        USER.username
    FROM
        USER
        JOIN LIKE ON USER.user_id = like.user_id
        JOIN tweet ON tweet.tweet_id = like.tweet_id
    where 
        tweet.tweet_id = ${tweetId}`)
        response.send({
            likes: [getlikers.map(user => user.username).join(", ")]
        })
    }

})

app.get("/tweets/:tweetId/replies", authenticateToken, async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params
    const validateTweetfollowing = await db.get(`
    SELECT DISTINCT
        user.username
    FROM
        follower
        JOIN user ON follower.following_user_id = user.user_id
        JOIN tweet ON follower.following_user_id = tweet.user_id
    WHERE
        follower.follower_user_id = (
            SELECT
                user_id
            FROM
                user
            WHERE
                user.username = "${username}"
        )
        AND tweet.tweet_id = ${tweetId};
    `)
    console.log(validateTweetfollowing)

    if (validateTweetfollowing === undefined) {
        response.status(401)
        response.send("Invalid Request")
    } else {
        const getReplies = await db.all(`SELECT
        user.username, reply.reply
    FROM
        user
        JOIN reply ON USER.user_id = reply.user_id
        JOIN tweet ON tweet.tweet_id = reply.tweet_id
    where 
        tweet.tweet_id = ${tweetId}`)
        response.send(getReplies)
        /*
            response.send({
                likes: [getReplies.map(user => {
                    return {
                        "name": user.username,
                        "reply": user.reply
                    }
                }).join(", ")]
            })*/
    }

})

app.get("/user/tweets/", authenticateToken, async (request, response) => {
    let { username } = request;
    const getUserTweetsQuery = `
    SELECT
        tweet.tweet,
        COUNT(LIKE.like_id) AS likes,
        COUNT(reply.reply_id) AS replies,
        tweet.date_time AS dateTime
    FROM
        tweet
        JOIN USER ON tweet.user_id = USER.user_id
        JOIN LIKE ON LIKE.tweet_id = tweet.tweet_id
        JOIN reply ON reply.tweet_id = tweet.tweet_id
    WHERE
        USER.username = "${username}"
    GROUP BY
        tweet.tweet;`

    const getUserTweets = await db.all(getUserTweetsQuery)
    response.send(getUserTweets)
})

app.post("/user/tweets/", authenticateToken, async (request, response) => {
    const { username } = request
    const { tweet } = request.body

    const createTweetQuery = `
    INSERT INTO
        tweet (tweet, user_id, date_time)
    VALUES
        (
            "${tweet}",
            (
                SELECT
                    user_id
                FROM
                    USER
                WHERE
                    username = "${username}"
            ),
            CURRENT_TIMESTAMP
        );
    `
    console.log(tweet)

    await db.run(createTweetQuery)
    response.send("Created a Tweet")
})

app.delete("/tweets/:tweetId", authenticateToken, async (request, response) => {
    const { username } = request
    const { tweetId } = request.params

    const validateTweetUser = await db.get(`
    SELECT
        USER.username
    FROM
        USER
        JOIN tweet ON USER.user_id = tweet.user_id
    WHERE
        tweet.tweet_id = ${tweetId}
        ;`)

    try {

        if (username === validateTweetUser.username) {
            const deleteTweetQuery = `
        DELETE FROM tweet
        WHERE 
            tweet_id = ${tweetId}
        `
            await db.run(deleteTweetQuery)
            response.send("Tweet Removed")
        } else {
            response.status(401)
            response.send("Invalid Request")
        }
    } catch (error) {
        console.log("API 11 - ", error.message, " \n cannot proceed with reequest due to error")
        response.status(401)
        response.send("Invalid Request")
    }
})

module.exports = app;
