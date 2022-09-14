# Tasky

## Brief Description

Very low tech html page to maintain date stamps for tasks completion.

## Description

This project was created to fulfill a need to keep track of when I've completed certain tasks.  For example, I needed to log when the dog got its last Heartworm/Fleas and Ticks medication. Another log about the timing on the AC Filter has been changed.

## My goals were:

- Quick and simple way to keep a log.
- Only I need to see it, no need to share.
- No authentication and the complexity that it brings.
- I could lose the data without feeling too much pain.


## Why and How

My goals were more of a reminder than actual goals to be honest... I already had the solution in mind.  I needed to use __localStorage only__.  That way, I do not have to deal with authentication/authorization schema or permanent store to keep that information. No, just a simple, database-less, storage system.

An added benefit was that nobody else could access and corrupt my data.  It was to be just accessible, in the web browser, but each person would have their own private "database". I provide you the tool, you use it by plugging your own private data.

The data are secure and private but they are sadly temporary and device-bound.  Anybody clearing their localStorage or changing device would lose the data. You can always backup the data or make manual changes by clicking on the bottom link __"Show/Set Local Storage"__.

So, here it is, a full html/css/javascript solution. I did have to use a very small external file from Day.js for date manipulations (https://day.js.org). The least amount of tech possible to avoid future upgrade/refresh, etc.  You can just drop it in a folder and start using it! No internet access required.

## Local storage data

```json
[
    {
        "task": "Dog Meds",
        "values" : [ "20210928", "20211029", "20211127" ],
        "20211029" : {
            "comment" : "She may have spit it out..."
        }
    },
    {
        "task": "AC Filter (6 mo)",
        "values" : [ "20210928" ],
        "20210928" : {
            "comment" : "They were very dirty"
        }
    }
]
```
NOTE: The date values are stored this way for easy sorting.


Enjoy!
