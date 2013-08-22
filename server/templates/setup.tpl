<?php include('header.tpl'); ?>

<div class="container">
    <div class="card">
        <form action="/setup" method="post" class="form-horizontal">
            <?php if (isset($alert)) : ?>
            <div class="alert alert-error">
                <?=$alert?>
            </div>
            <?php endif; ?>

            <div class="card-body">
                <fieldset>
                    <legend>Login Setup</legend>
                    <div class="control-group">
                        <label for="email" class="control-label">Email Address</label>
                        <div class="controls">
                            <input type="email" required name="email" id="email" class="input-xxlarge">
                            <span class="help-block">This will be the Admin's login : <span id="emailText"></span></span>
                        </div>
                    </div>
                    <div class="control-group">
                        <label for="password" class="control-label">Password</label>
                        <div class="controls">
                            <input type="password" required name="password" id="password" class="input-xxlarge" pattern=".{6,}" title="6 Characters Minimum">
                            <span class="help-block">This will be the Admin's password : <span id="passwordText" class="passw"></span></span>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Database Settings</legend>
                    <div class="control-group">
                        <label for="" class="control-label">Database Type</label>
                        <div class="controls">
                            <label class="radio" for="sqlite">
                              <input type="radio" required name="dbtype" id="sqlite" value="sqlite">
                                SQLite - Best for development.
                            </label>
                            <label class="radio" for="mysql">
                              <input type="radio" required name="dbtype" id="mysql" value="mysql">
                                MySQL - Best for production.
                            </label>
                        </div>
                    </div>
                    <div class="control-group">
                        <label for="dbname" class="control-label">Database
                            <span class="if" data-if="dbtype=sqlite">File</span> Name
                        </label>
                        <div class="controls">
                            <input type="text" required name="dbname" id="dbname" class="input-xxlarge">
                        </div>
                    </div>
                    <span class="if" data-if="dbtype=mysql" style="display:none">
                        <div class="control-group">
                            <label for="dbhost" class="control-label">Database Host</label>
                            <div class="controls">
                                <input type="text" required name="dbhost" id="dbhost" class="input-xxlarge">
                            </div>
                        </div>
                    </span>
                    <div class="control-group">
                        <label for="dbuser" class="control-label">Database User</label>
                        <div class="controls">
                            <input type="text" name="dbuser" id="dbuser" class="input-xxlarge">
                        </div>
                    </div>
                    <div class="control-group">
                        <label for="dbpass" class="control-label">Database Password</label>
                        <div class="controls">
                            <input type="password" name="dbpass" id="dbpass" class="input-xxlarge">
                            <span class="help-block">Database Password : <span id="dbpassText" class="passw"></span></span>
                        </div>
                    </div>
                </fieldset>
                <hr>
                <button class="btn btn-primary" type="submit">Save Configuration</button>
            </div>
        </form>
    </div>
</div>
<script>
    watch.add('email', function(value) { $('#emailText').text(value); });
    watch.add('password', function(value) { $('#passwordText').text(value); });
    watch.add('dbuser', function(value) { $('#dbuserText').text(value); });
    watch.add('dbpass', function(value) { $('#dbpassText').text(value); });
</script>

<?php include('footer.tpl'); ?>